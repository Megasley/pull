import type { GithubClient } from "./client";
import { inferContributionType } from "./contribution-type";
import {
  GITHUB_ACTIVITY_LIMIT,
  GITHUB_COMMIT_REPO_LIMIT,
  GITHUB_COMMITS_PER_REPO,
  GITHUB_PR_ENRICH_BUDGET,
  GITHUB_PR_SEARCH_MAX_PAGES,
  GITHUB_REPO_MAX_PAGES,
  GITHUB_REVIEW_SEARCH_MAX_PAGES,
} from "./config";

export type GithubApiUser = {
  id: number;
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
};

export type GithubApiRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  fork: boolean;
  private: boolean;
  default_branch: string | null;
  pushed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  topics?: string[];
  license: { spdx_id: string | null } | null;
};

type SearchIssueItem = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at?: string;
  closed_at: string | null;
  labels?: Array<{ name: string } | string>;
  pull_request?: { merged_at?: string | null; url?: string };
  repository_url: string;
  user?: { login: string } | null;
};

type SearchResponse = {
  items: SearchIssueItem[];
};

type PullRequestDetail = {
  merged: boolean;
  merged_at: string | null;
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  review_comments: number;
  comments: number;
  labels: Array<{ name: string }>;
};

type CommitItem = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { date: string } | null;
    committer: { date: string } | null;
  };
};

type ContributionGraphql = {
  viewer: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{
          contributionDays: Array<{
            date: string;
            contributionCount: number;
            color: string;
          }>;
        }>;
      };
    };
    pinnedItems: {
      nodes: Array<{
        __typename?: string;
        nameWithOwner?: string;
      } | null>;
    };
  };
};

function repoFullNameFromUrl(repositoryUrl: string): string {
  // https://api.github.com/repos/owner/repo
  const parts = repositoryUrl.split("/");
  const repo = parts.pop() ?? "";
  const owner = parts.pop() ?? "";
  return owner && repo ? `${owner}/${repo}` : repositoryUrl;
}

export async function fetchAuthenticatedUser(client: GithubClient) {
  return client.request<GithubApiUser>("/user");
}

export async function fetchUserRepositories(client: GithubClient) {
  return client.requestPaginated<GithubApiRepo>(
    "/user/repos?sort=updated&affiliation=owner,collaborator,organization_member",
    {
      maxPages: GITHUB_REPO_MAX_PAGES,
      perPage: 100,
    },
  );
}

export async function fetchPinnedAndContributions(client: GithubClient) {
  return client.graphql<ContributionGraphql>(`
    query {
      viewer {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              nameWithOwner
            }
          }
        }
      }
    }
  `);
}

function labelNames(labels: Array<{ name: string } | string> | undefined): string[] {
  if (!labels) return [];
  return labels.map((label) => (typeof label === "string" ? label : label.name));
}

export async function fetchAuthoredPullRequests(
  client: GithubClient,
  login: string,
  options: {
    languageByRepo?: Record<string, string | null>;
    enrichBudget?: number;
    /** githubIds already known merged/closed as of the last sync — their
     *  terminal state can't change, so we skip spending enrichment budget
     *  re-fetching them. See lib/github/store.ts:partitionResolvedPullRequests. */
    resolvedGithubIds?: Set<number>;
  } = {},
) {
  const languageByRepo = options.languageByRepo ?? {};
  const enrichBudgetTotal = options.enrichBudget ?? GITHUB_PR_ENRICH_BUDGET;
  const resolvedGithubIds = options.resolvedGithubIds ?? new Set<number>();

  const items: SearchResponse["items"] = [];
  for (let page = 1; page <= GITHUB_PR_SEARCH_MAX_PAGES; page += 1) {
    const data = await client.request<SearchResponse>(
      `/search/issues?q=${encodeURIComponent(`author:${login} type:pr`)}&sort=updated&order=desc&per_page=${GITHUB_ACTIVITY_LIMIT}&page=${page}`,
    );
    items.push(...data.items);
    if (data.items.length < GITHUB_ACTIVITY_LIMIT) break;
  }

  const base = items.map((item) => {
    const repoFullName = repoFullNameFromUrl(item.repository_url);
    const labels = labelNames(item.labels);
    return {
      githubId: item.id,
      number: item.number,
      title: item.title,
      state: item.state,
      merged: Boolean(item.pull_request?.merged_at),
      draft: false,
      repoFullName,
      htmlUrl: item.html_url,
      githubCreatedAt: item.created_at,
      githubClosedAt: item.closed_at,
      githubMergedAt: item.pull_request?.merged_at ?? null,
      labels,
      language: languageByRepo[repoFullName] ?? null,
      filesChanged: 0,
      additions: 0,
      deletions: 0,
      reviewComments: 0,
      contributionType: "other",
      /** False means: draft/filesChanged/additions/deletions/reviewComments
       *  below are search-API defaults, NOT verified — callers with a prior
       *  DB row for this PR should keep the prior row's values for those
       *  fields rather than overwrite with these placeholders. */
      enriched: false,
    };
  });

  // Spend the enrichment budget on PRs that aren't already known-resolved —
  // that's where an accurate draft/ready-for-review read actually matters.
  let budget = enrichBudgetTotal;
  for (const item of base) {
    if (resolvedGithubIds.has(item.githubId)) {
      item.contributionType = inferContributionType(item.title, item.labels);
      continue;
    }
    if (budget <= 0) {
      item.contributionType = inferContributionType(item.title, item.labels);
      continue;
    }
    budget -= 1;

    try {
      const detail = await client.request<PullRequestDetail>(
        `/repos/${item.repoFullName}/pulls/${item.number}`,
      );
      item.merged = detail.merged || item.merged;
      item.draft = Boolean(detail.draft);
      item.githubMergedAt = detail.merged_at ?? item.githubMergedAt;
      item.filesChanged = detail.changed_files ?? 0;
      item.additions = detail.additions ?? 0;
      item.deletions = detail.deletions ?? 0;
      item.reviewComments = (detail.review_comments ?? 0) + (detail.comments ?? 0);
      if (detail.labels?.length) {
        item.labels = detail.labels.map((label) => label.name);
      }
      item.enriched = true;
    } catch {
      // Keep search-level data if detail fetch fails — not enriched.
    }

    item.contributionType = inferContributionType(item.title, item.labels);
  }

  return base;
}

export async function fetchReviewedPullRequests(
  client: GithubClient,
  login: string,
  languageByRepo: Record<string, string | null> = {},
) {
  const items: SearchResponse["items"] = [];
  for (let page = 1; page <= GITHUB_REVIEW_SEARCH_MAX_PAGES; page += 1) {
    const data = await client.request<SearchResponse>(
      `/search/issues?q=${encodeURIComponent(`type:pr reviewed-by:${login} -author:${login}`)}&sort=updated&order=desc&per_page=${GITHUB_ACTIVITY_LIMIT}&page=${page}`,
    );
    items.push(...data.items);
    if (data.items.length < GITHUB_ACTIVITY_LIMIT) break;
  }

  return items.map((item) => {
    const repoFullName = repoFullNameFromUrl(item.repository_url);
    return {
      githubId: item.id,
      number: item.number,
      title: item.title,
      state: item.state,
      merged: Boolean(item.pull_request?.merged_at),
      repoFullName,
      htmlUrl: item.html_url,
      authorLogin: item.user?.login ?? null,
      language: languageByRepo[repoFullName] ?? null,
      githubCreatedAt: item.created_at,
      githubUpdatedAt: item.updated_at ?? null,
    };
  });
}

export type DiscoveredPullRequest = {
  githubId: number;
  number: number;
  title: string;
  htmlUrl: string;
  authorLogin: string;
  repoFullName: string;
  githubCreatedAt: string;
};

/**
 * Finds open, non-draft PRs with zero reviews yet in a specific repo — the
 * seed data for the PR review discovery dashboard's auto-discovery job
 * (lib/pr-reviews/discovery.ts). Unlike every other search in this file,
 * this isn't scoped to any connected Pull user — `client` may be built with
 * an empty token (unauthenticated, lower rate limit) since this runs on a
 * schedule, not on behalf of a signed-in user.
 */
export async function fetchRepoPullRequestsNeedingReview(
  client: GithubClient,
  repoFullName: string,
  limit: number,
): Promise<DiscoveredPullRequest[]> {
  const data = await client.request<SearchResponse>(
    `/search/issues?q=${encodeURIComponent(`repo:${repoFullName} type:pr is:open draft:false review:none`)}&sort=created&order=asc&per_page=${limit}`,
  );

  return data.items.map((item) => ({
    githubId: item.id,
    number: item.number,
    title: item.title,
    htmlUrl: item.html_url,
    authorLogin: item.user?.login ?? "",
    repoFullName,
    githubCreatedAt: item.created_at,
  }));
}

type ArbitraryPullRequestDetail = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  merged: boolean;
  user: { login: string } | null;
};

export type FetchedPullRequest = {
  number: number;
  title: string;
  htmlUrl: string;
  state: string;
  merged: boolean;
  authorLogin: string;
};

/**
 * Fetches a single PR by owner/repo/number — unlike every other function in
 * this file, not scoped to any connected Pull user's own authored/reviewed
 * PRs. Used by the PR review discovery dashboard (lib/pr-reviews/) to look
 * up a PR a builder pasted a URL for, which Pull may never have seen before.
 */
export async function fetchPullRequestByUrl(
  client: GithubClient,
  owner: string,
  repo: string,
  number: number,
): Promise<FetchedPullRequest> {
  const detail = await client.request<ArbitraryPullRequestDetail>(
    `/repos/${owner}/${repo}/pulls/${number}`,
  );

  return {
    number: detail.number,
    title: detail.title,
    htmlUrl: detail.html_url,
    state: detail.state,
    merged: detail.merged,
    authorLogin: detail.user?.login ?? "",
  };
}

export async function fetchAuthoredIssues(client: GithubClient, login: string) {
  const data = await client.request<SearchResponse>(
    `/search/issues?q=${encodeURIComponent(`author:${login} type:issue`)}&sort=updated&order=desc&per_page=${GITHUB_ACTIVITY_LIMIT}`,
  );

  return data.items.map((item) => ({
    githubId: item.id,
    number: item.number,
    title: item.title,
    state: item.state,
    relation: "authored" as const,
    repoFullName: repoFullNameFromUrl(item.repository_url),
    htmlUrl: item.html_url,
    githubCreatedAt: item.created_at,
    githubClosedAt: item.closed_at,
  }));
}

export async function fetchAssignedIssues(client: GithubClient, login: string) {
  const data = await client.request<SearchResponse>(
    `/search/issues?q=${encodeURIComponent(`assignee:${login} type:issue state:open`)}&sort=updated&order=desc&per_page=${GITHUB_ACTIVITY_LIMIT}`,
  );

  return data.items.map((item) => ({
    githubId: item.id,
    number: item.number,
    title: item.title,
    state: item.state,
    relation: "assigned" as const,
    repoFullName: repoFullNameFromUrl(item.repository_url),
    htmlUrl: item.html_url,
    githubCreatedAt: item.created_at,
    githubClosedAt: item.closed_at,
  }));
}

export async function fetchRecentCommits(
  client: GithubClient,
  login: string,
  repos: Array<{ full_name: string; fork: boolean }>,
) {
  const targets = repos.filter((repo) => !repo.fork).slice(0, GITHUB_COMMIT_REPO_LIMIT);

  const results: Array<{
    sha: string;
    message: string;
    repoFullName: string;
    htmlUrl: string;
    committedAt: string | null;
  }> = [];

  for (const repo of targets) {
    try {
      const commits = await client.request<CommitItem[]>(
        `/repos/${repo.full_name}/commits?author=${encodeURIComponent(login)}&per_page=${GITHUB_COMMITS_PER_REPO}`,
      );

      for (const commit of commits) {
        results.push({
          sha: commit.sha,
          message: commit.commit.message.split("\n")[0] ?? commit.commit.message,
          repoFullName: repo.full_name,
          htmlUrl: commit.html_url,
          committedAt:
            commit.commit.author?.date ?? commit.commit.committer?.date ?? null,
        });
      }
    } catch {
      // Skip repos that deny commit listing (empty, archived, permissions).
    }
  }

  results.sort((a, b) => {
    const aTime = a.committedAt ? Date.parse(a.committedAt) : 0;
    const bTime = b.committedAt ? Date.parse(b.committedAt) : 0;
    return bTime - aTime;
  });

  return results.slice(0, GITHUB_ACTIVITY_LIMIT);
}
