import { GithubClient, GithubApiError } from "./client";
import { GITHUB_SYNC_INTERVAL_MS } from "./config";
import {
  fetchAuthenticatedUser,
  fetchAssignedIssues,
  fetchAuthoredIssues,
  fetchAuthoredPullRequests,
  fetchPinnedAndContributions,
  fetchRecentCommits,
  fetchReviewedPullRequests,
  fetchUserRepositories,
} from "./api";
import {
  loadOpportunityClicksForAttribution,
  loadPartnerMembershipsForAttribution,
  resolveOpportunityAttribution,
  resolvePartnerAttribution,
} from "./attribution";
import {
  deriveLifecycleEvents,
  getExistingPullRequestsForSync,
  getGithubConnection,
  getResolvedGithubIds,
  markGithubSyncSuccess,
  recordPullRequestEvents,
  replaceGithubCommits,
  replaceGithubContributionDays,
  replaceGithubIssues,
  replaceGithubRepositories,
  replaceGithubReviewedPullRequests,
  setGithubSyncStatus,
  updateGithubConnectionToken,
  upsertGithubConnection,
  upsertGithubPullRequests,
  type PullRequestSyncInput,
} from "./store";
import { isPracticeRepoFullName } from "@/lib/first-contribution/practice-repo";
import { derivePrMilestoneCandidates } from "@/lib/milestones/pr-signals";
import { recordMilestones } from "@/lib/milestones/service";
import { markReviewedByMatch } from "@/lib/pr-reviews/repository";
import type { GithubSyncSummary } from "@/types/github";

export type SyncGithubResult =
  { ok: true; summary: GithubSyncSummary } | { ok: false; error: string };

function nextSyncIso(from = new Date()) {
  return new Date(from.getTime() + GITHUB_SYNC_INTERVAL_MS).toISOString();
}

/**
 * Full GitHub sync for a user. All API + persistence stays in lib/github.
 */
export async function syncGithubForUser(
  userId: string,
  options: { accessToken?: string | null } = {},
): Promise<SyncGithubResult> {
  const existing = await getGithubConnection(userId);
  const accessToken = options.accessToken ?? existing?.accessToken ?? null;

  if (!accessToken) {
    return {
      ok: false,
      error: "GitHub is not connected. Sign in with GitHub again to grant API access.",
    };
  }

  if (existing && options.accessToken && options.accessToken !== existing.accessToken) {
    await updateGithubConnectionToken(userId, options.accessToken);
  }

  await setGithubSyncStatus(userId, "syncing");

  try {
    const client = new GithubClient(accessToken);
    const user = await fetchAuthenticatedUser(client);

    // Ensure connection row exists before replacing child tables.
    await upsertGithubConnection({
      userId,
      githubUserId: user.id,
      login: user.login,
      accessToken,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      name: user.name,
      bio: user.bio ?? "",
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      syncStatus: "syncing",
      syncError: null,
    });

    const [
      repos,
      graph,
      authoredIssues,
      assignedIssues,
      existingPullRequests,
      memberships,
      opportunityClicks,
    ] = await Promise.all([
      fetchUserRepositories(client),
      fetchPinnedAndContributions(client),
      fetchAuthoredIssues(client, user.login),
      fetchAssignedIssues(client, user.login),
      getExistingPullRequestsForSync(userId),
      loadPartnerMembershipsForAttribution(userId),
      loadOpportunityClicksForAttribution(userId),
    ]);

    const languageByRepo = Object.fromEntries(
      repos.map((repo) => [repo.full_name, repo.language]),
    );

    const [fetchedPullRequests, reviewedPullRequests] = await Promise.all([
      fetchAuthoredPullRequests(client, user.login, {
        languageByRepo,
        resolvedGithubIds: getResolvedGithubIds(existingPullRequests),
      }),
      fetchReviewedPullRequests(client, user.login, languageByRepo),
    ]);

    const pullRequestInputs: PullRequestSyncInput[] = fetchedPullRequests.map(
      (item) => {
        const isOwnRepo =
          item.repoFullName.split("/")[0]?.toLowerCase() === user.login.toLowerCase();
        const isPracticeRepo = isPracticeRepoFullName(item.repoFullName);
        const isNew = !existingPullRequests.has(item.githubId);

        return {
          ...item,
          isOwnRepo,
          isPracticeRepo,
          attributedPartnerId: isNew
            ? resolvePartnerAttribution(memberships, item.githubCreatedAt)
            : null,
          attributedOpportunityEventId: isNew
            ? resolveOpportunityAttribution(
                opportunityClicks,
                item.repoFullName,
                item.githubCreatedAt,
              )
            : null,
        };
      },
    );

    const upsertResults = await upsertGithubPullRequests(
      userId,
      pullRequestInputs,
      existingPullRequests,
    );
    const lifecycleEvents = deriveLifecycleEvents(upsertResults, userId);
    await recordPullRequestEvents(lifecycleEvents);

    // Idempotent: recordMilestones() is a no-op for any milestone this user
    // already has, so a re-run over the same PRs (or a partially-overlapping
    // batch) never creates duplicates. Derived from the same upsertResults
    // already computed above — no extra GitHub API calls or DB reads.
    const milestoneCandidates = derivePrMilestoneCandidates(upsertResults, userId);
    await recordMilestones(milestoneCandidates);

    const pullRequests = pullRequestInputs;

    const pinnedNames = new Set(
      graph.viewer.pinnedItems.nodes
        .map((node) => node?.nameWithOwner)
        .filter((value): value is string => Boolean(value)),
    );

    const mappedRepos = repos.map((repo) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      openIssuesCount: repo.open_issues_count,
      licenseSpdx: repo.license?.spdx_id ?? null,
      topics: repo.topics ?? [],
      isFork: repo.fork,
      isPrivate: repo.private,
      isPinned: pinnedNames.has(repo.full_name),
      defaultBranch: repo.default_branch,
      pushedAt: repo.pushed_at,
      githubCreatedAt: repo.created_at,
      githubUpdatedAt: repo.updated_at,
    }));

    const totalStars = mappedRepos.reduce((sum, repo) => sum + repo.stargazersCount, 0);

    const contributionDays =
      graph.viewer.contributionsCollection.contributionCalendar.weeks
        .flatMap((week) => week.contributionDays)
        .map((day) => ({
          contributionDate: day.date,
          count: day.contributionCount,
          color: day.color,
        }));

    const commits = await fetchRecentCommits(
      client,
      user.login,
      repos.map((repo) => ({ full_name: repo.full_name, fork: repo.fork })),
    );

    const issueByGithubId = new Map<
      number,
      {
        githubId: number;
        number: number;
        title: string;
        state: string;
        relation: "authored" | "assigned";
        repoFullName: string;
        htmlUrl: string;
        githubCreatedAt: string | null;
        githubClosedAt: string | null;
      }
    >();
    for (const issue of authoredIssues) {
      issueByGithubId.set(issue.githubId, issue);
    }
    for (const issue of assignedIssues) {
      // Assigned wins when the same issue appears in both searches.
      issueByGithubId.set(issue.githubId, issue);
    }
    const issues = [...issueByGithubId.values()];

    await replaceGithubRepositories(userId, mappedRepos);
    await replaceGithubIssues(userId, issues);
    await replaceGithubReviewedPullRequests(userId, reviewedPullRequests);

    // Credit-detection loop for the PR review discovery dashboard: this
    // user's own review sync just refreshed, so cross-reference it against
    // any open review requests. Rides the existing sync rather than adding
    // a separate poller — see lib/pr-reviews/repository.ts.
    for (const reviewed of reviewedPullRequests) {
      await markReviewedByMatch(reviewed.repoFullName, reviewed.number, userId);
    }

    await replaceGithubCommits(userId, commits);
    await replaceGithubContributionDays(userId, contributionDays);

    await markGithubSyncSuccess(userId, {
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      totalStars,
      nextSyncAt: nextSyncIso(),
    });

    const { refreshUserScoreSnapshots } = await import("@/lib/builders/snapshots");
    await refreshUserScoreSnapshots(userId);

    // Detects newly-earned PR-based achievements (first PR, first merged PR)
    // and fires the achievement-unlock email automatically.
    const { syncAchievementsForUser } = await import("@/lib/xp/achievements");
    await syncAchievementsForUser(userId);

    return {
      ok: true,
      summary: {
        repositories: mappedRepos.length,
        pullRequests: pullRequests.length,
        issues: issues.length,
        commits: commits.length,
        contributionDays: contributionDays.length,
        totalStars,
        reviewsGiven: reviewedPullRequests.length,
      },
    };
  } catch (error) {
    const message =
      error instanceof GithubApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "GitHub sync failed";

    await setGithubSyncStatus(userId, "error", message);
    return { ok: false, error: message };
  }
}
