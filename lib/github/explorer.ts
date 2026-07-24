import type { GithubRepositoryRecord } from "@/types/github";

export const REPO_PAGE_SIZE = 12;

export type RepoSort = "recent" | "stars" | "name";

export type RepoContributionStatus =
  | "pinned"
  | "active"
  | "maintained"
  | "quiet"
  | "fork";

export type RepoExplorerFilters = {
  query: string;
  language: string | "all";
  sort: RepoSort;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getRepoContributionStatus(
  repo: GithubRepositoryRecord,
  now = Date.now(),
): RepoContributionStatus {
  if (repo.isFork) return "fork";
  if (repo.isPinned) return "pinned";

  const pushed = repo.pushedAt ? Date.parse(repo.pushedAt) : NaN;
  if (!Number.isFinite(pushed)) return "quiet";

  const age = now - pushed;
  if (age <= 30 * DAY_MS) return "active";
  if (age <= 90 * DAY_MS) return "maintained";
  return "quiet";
}

export const CONTRIBUTION_STATUS_LABEL: Record<RepoContributionStatus, string> = {
  pinned: "Pinned",
  active: "Actively shipping",
  maintained: "Maintained",
  quiet: "Quiet",
  fork: "Fork",
};

export function getRepositoryLanguages(
  repositories: GithubRepositoryRecord[],
): string[] {
  const counts = new Map<string, number>();

  for (const repo of repositories) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([language]) => language);
}

export function filterAndSortRepositories(
  repositories: GithubRepositoryRecord[],
  filters: RepoExplorerFilters,
): GithubRepositoryRecord[] {
  const query = filters.query.trim().toLowerCase();

  let result = repositories.filter((repo) => {
    if (filters.language !== "all" && repo.language !== filters.language) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      repo.name,
      repo.fullName,
      repo.description ?? "",
      repo.language ?? "",
      repo.licenseSpdx ?? "",
      ...repo.topics,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  result = [...result].sort((a, b) => {
    if (!query && filters.sort !== "name") {
      const pin = Number(b.isPinned) - Number(a.isPinned);
      if (pin !== 0) return pin;
    }

    if (filters.sort === "name") {
      return a.name.localeCompare(b.name);
    }

    if (filters.sort === "stars") {
      if (b.stargazersCount !== a.stargazersCount) {
        return b.stargazersCount - a.stargazersCount;
      }
      return a.name.localeCompare(b.name);
    }

    const aTime = Date.parse(a.pushedAt ?? a.githubUpdatedAt ?? "") || 0;
    const bTime = Date.parse(b.pushedAt ?? b.githubUpdatedAt ?? "") || 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });

  return result;
}

export function paginateRepositories<T>(
  items: T[],
  page: number,
  pageSize = REPO_PAGE_SIZE,
) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    pageSize,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export function formatRelativeUpdated(iso: string | null): string {
  if (!iso) return "Unknown";
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "Unknown";

  const delta = Date.now() - time;
  const days = Math.floor(delta / DAY_MS);

  if (days < 1) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 30) return `Updated ${days}d ago`;
  if (days < 365) return `Updated ${Math.floor(days / 30)}mo ago`;
  return `Updated ${Math.floor(days / 365)}y ago`;
}
