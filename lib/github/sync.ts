import { GithubClient, GithubApiError } from "./client";
import { GITHUB_SYNC_INTERVAL_MS } from "./config";
import {
  fetchAuthenticatedUser,
  fetchAssignedIssues,
  fetchAuthoredIssues,
  fetchAuthoredPullRequests,
  fetchPinnedAndContributions,
  fetchRecentCommits,
  fetchUserRepositories,
} from "./api";
import {
  getGithubConnection,
  markGithubSyncSuccess,
  replaceGithubCommits,
  replaceGithubContributionDays,
  replaceGithubIssues,
  replaceGithubPullRequests,
  replaceGithubRepositories,
  setGithubSyncStatus,
  updateGithubConnectionToken,
  upsertGithubConnection,
} from "./store";
import type { GithubSyncSummary } from "@/types/github";

export type SyncGithubResult =
  | { ok: true; summary: GithubSyncSummary }
  | { ok: false; error: string };

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
      error:
        "GitHub is not connected. Sign in with GitHub again to grant API access.",
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

    const [repos, graph, authoredIssues, assignedIssues] = await Promise.all([
      fetchUserRepositories(client),
      fetchPinnedAndContributions(client),
      fetchAuthoredIssues(client, user.login),
      fetchAssignedIssues(client, user.login),
    ]);

    const languageByRepo = Object.fromEntries(
      repos.map((repo) => [repo.full_name, repo.language]),
    );

    const pullRequests = await fetchAuthoredPullRequests(client, user.login, {
      languageByRepo,
      enrichLimit: 25,
    });

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

    const totalStars = mappedRepos.reduce(
      (sum, repo) => sum + repo.stargazersCount,
      0,
    );

    const contributionDays = graph.viewer.contributionsCollection.contributionCalendar.weeks
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
    await replaceGithubPullRequests(userId, pullRequests);
    await replaceGithubIssues(userId, issues);
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

    return {
      ok: true,
      summary: {
        repositories: mappedRepos.length,
        pullRequests: pullRequests.length,
        issues: issues.length,
        commits: commits.length,
        contributionDays: contributionDays.length,
        totalStars,
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
