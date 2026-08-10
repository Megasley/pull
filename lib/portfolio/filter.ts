import { inferContributionType } from "@/lib/github/contribution-type";
import type { GithubPullRequestRecord } from "@/types/github";
import type {
  ContributionType,
  PortfolioFilters,
  PullRequestPortfolioItem,
  PullRequestPortfolioStatus,
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

  // Merged contributions first, then by merged/created date.
  return [...filtered].sort((a, b) => {
    if (a.merged !== b.merged) return Number(b.merged) - Number(a.merged);
    const aTime = Date.parse(a.mergedAt ?? a.createdAt ?? "") || 0;
    const bTime = Date.parse(b.mergedAt ?? b.createdAt ?? "") || 0;
    return bTime - aTime;
  });
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

export function getPortfolioStats(items: PullRequestPortfolioItem[]) {
  return {
    total: items.length,
    merged: items.filter((item) => item.merged).length,
    open: items.filter((item) => item.status === "open").length,
    closed: items.filter((item) => item.status === "closed").length,
    repos: new Set(items.map((item) => item.repoFullName)).size,
  };
}
