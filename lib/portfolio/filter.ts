import { inferContributionType } from "@/lib/github/contribution-type";
import type {
  GithubPullRequestRecord,
  GithubReviewedPullRequestRecord,
} from "@/types/github";
import type {
  ContributionType,
  PortfolioCadence,
  PortfolioFilters,
  PortfolioRepoBreakdown,
  PortfolioSort,
  PullRequestPortfolioItem,
  PullRequestPortfolioStatus,
  PullRequestReviewItem,
} from "@/types/portfolio";

export const PORTFOLIO_PAGE_SIZE = 12;

export const CONTRIBUTION_TYPE_LABEL: Record<ContributionType, string> = {
  documentation: "Documentation",
  bug_fix: "Bug fix",
  feature: "Feature",
  test: "Tests",
  refactor: "Refactor",
  chore: "Chore",
  other: "Other",
};

export const PORTFOLIO_STATUS_LABEL: Record<
  PullRequestPortfolioStatus | "all",
  string
> = {
  all: "All statuses",
  merged: "Merged",
  open: "Open",
  closed: "Closed",
};

export const PORTFOLIO_SORT_LABEL: Record<PortfolioSort, string> = {
  merged: "Most merged",
  recent: "Most recent",
  impact: "Most impactful",
};

export const DEFAULT_PORTFOLIO_FILTERS: PortfolioFilters = {
  query: "",
  status: "all",
  language: "all",
  repo: "all",
  contributionType: "all",
  mergedOnly: false,
  sort: "merged",
};

export { inferContributionType };

export function resolvePortfolioStatus(
  state: string,
  merged: boolean,
): PullRequestPortfolioStatus {
  if (merged) return "merged";
  if (state === "open") return "open";
  return "closed";
}

export function toPortfolioItem(pr: GithubPullRequestRecord): PullRequestPortfolioItem {
  const labels = pr.labels ?? [];
  const contributionType =
    (pr.contributionType as ContributionType) ||
    inferContributionType(pr.title, labels);

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    status: resolvePortfolioStatus(pr.state, pr.merged),
    merged: pr.merged,
    repoFullName: pr.repoFullName,
    htmlUrl: pr.htmlUrl,
    createdAt: pr.githubCreatedAt,
    mergedAt: pr.githubMergedAt,
    labels,
    language: pr.language,
    filesChanged: pr.filesChanged ?? 0,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    reviewComments: pr.reviewComments ?? 0,
    contributionType: [
      "documentation",
      "bug_fix",
      "feature",
      "test",
      "refactor",
      "chore",
      "other",
    ].includes(contributionType)
      ? contributionType
      : inferContributionType(pr.title, labels),
  };
}

export function sortPortfolioItems(
  items: PullRequestPortfolioItem[],
  sort: PortfolioSort,
): PullRequestPortfolioItem[] {
  const recencyTime = (item: PullRequestPortfolioItem) =>
    Date.parse(item.mergedAt ?? item.createdAt ?? "") || 0;

  switch (sort) {
    case "impact":
      return [...items].sort((a, b) => {
        const impact = b.additions + b.deletions - (a.additions + a.deletions);
        return impact !== 0 ? impact : recencyTime(b) - recencyTime(a);
      });
    case "recent":
      return [...items].sort((a, b) => recencyTime(b) - recencyTime(a));
    case "merged":
    default:
      return [...items].sort((a, b) => {
        if (a.merged !== b.merged) return Number(b.merged) - Number(a.merged);
        return recencyTime(b) - recencyTime(a);
      });
  }
}

export function filterPortfolioItems(
  items: PullRequestPortfolioItem[],
  filters: PortfolioFilters,
): PullRequestPortfolioItem[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (filters.mergedOnly && !item.merged) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.language !== "all" && item.language !== filters.language) {
      return false;
    }
    if (filters.repo !== "all" && item.repoFullName !== filters.repo) return false;
    if (
      filters.contributionType !== "all" &&
      item.contributionType !== filters.contributionType
    ) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      item.title,
      item.repoFullName,
      item.language ?? "",
      item.contributionType,
      ...item.labels,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return sortPortfolioItems(filtered, filters.sort);
}

export function paginatePortfolioItems<T>(
  items: T[],
  page: number,
  pageSize = PORTFOLIO_PAGE_SIZE,
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
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export function getPortfolioLanguages(items: PullRequestPortfolioItem[]) {
  return [
    ...new Set(
      items
        .map((item) => item.language)
        .filter((language): language is string => Boolean(language)),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

export function getPortfolioRepoBreakdown(
  items: Array<{ repoFullName: string }>,
  limit = 6,
): PortfolioRepoBreakdown[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.repoFullName, (counts.get(item.repoFullName) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([repoFullName, count]) => ({ repoFullName, count }))
    .sort((a, b) => b.count - a.count || a.repoFullName.localeCompare(b.repoFullName))
    .slice(0, limit);
}

/**
 * Monthly PR cadence over the trailing 12 months (oldest -> newest), keyed
 * off merged date when available so it reflects landed work, not just
 * opened-but-abandoned PRs.
 */
export function getPortfolioCadence(
  items: PullRequestPortfolioItem[],
): PortfolioCadence {
  const now = new Date();
  const counts = new Map<string, number>();

  for (const item of items) {
    const source = item.mergedAt ?? item.createdAt;
    if (!source) continue;
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const months: PortfolioCadence["months"] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const monthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
    );
    const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({
      monthKey,
      label: monthDate.toLocaleDateString(undefined, {
        month: "short",
        timeZone: "UTC",
      }),
      count: counts.get(monthKey) ?? 0,
    });
  }

  return {
    months,
    activeMonths: months.filter((month) => month.count > 0).length,
  };
}

export function toReviewItem(
  pr: GithubReviewedPullRequestRecord,
): PullRequestReviewItem {
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    status: resolvePortfolioStatus(pr.state, pr.merged),
    merged: pr.merged,
    repoFullName: pr.repoFullName,
    htmlUrl: pr.htmlUrl,
    authorLogin: pr.authorLogin,
    language: pr.language,
    createdAt: pr.githubCreatedAt,
    updatedAt: pr.githubUpdatedAt,
  };
}

export function filterReviewItems(
  items: PullRequestReviewItem[],
  filters: { query: string; repo: string | "all" },
): PullRequestReviewItem[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (filters.repo !== "all" && item.repoFullName !== filters.repo) return false;
    if (!query) return true;

    const haystack = [
      item.title,
      item.repoFullName,
      item.authorLogin ?? "",
      item.language ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return [...filtered].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0;
    const bTime = Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0;
    return bTime - aTime;
  });
}

export function getPortfolioStats(items: PullRequestPortfolioItem[]) {
  return {
    total: items.length,
    merged: items.filter((item) => item.merged).length,
    open: items.filter((item) => item.status === "open").length,
    closed: items.filter((item) => item.status === "closed").length,
    repos: new Set(items.map((item) => item.repoFullName)).size,
  };
}
