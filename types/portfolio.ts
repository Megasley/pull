export type ContributionType =
  "documentation" | "bug_fix" | "feature" | "test" | "refactor" | "chore" | "other";

export type PullRequestPortfolioStatus = "merged" | "open" | "closed";

export type PortfolioSort = "recent" | "merged" | "impact";

/**
 * How a PR relates to the builder's own GitHub footprint, distinct from
 * `contributionType` (what the PR changed):
 * - "self": into a repo the builder owns.
 * - "maintainer": into a repo the builder doesn't own but has
 *   collaborator/org-member access to (appears in their synced repos).
 * - "external": into a repo the builder has no access to — the strongest
 *   open source signal. See lib/portfolio/pr-role.ts.
 */
export type PullRequestContributorRole = "external" | "maintainer" | "self";

export type PullRequestPortfolioItem = {
  id: string;
  number: number;
  title: string;
  status: PullRequestPortfolioStatus;
  merged: boolean;
  repoFullName: string;
  htmlUrl: string;
  createdAt: string | null;
  mergedAt: string | null;
  labels: string[];
  language: string | null;
  filesChanged: number;
  additions: number;
  deletions: number;
  reviewComments: number;
  contributionType: ContributionType;
  role: PullRequestContributorRole;
};

export type PullRequestReviewItem = {
  id: string;
  number: number;
  title: string;
  status: PullRequestPortfolioStatus;
  merged: boolean;
  repoFullName: string;
  htmlUrl: string;
  authorLogin: string | null;
  language: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PortfolioFilters = {
  query: string;
  status: PullRequestPortfolioStatus | "all";
  language: string | "all";
  repo: string | "all";
  contributionType: ContributionType | "all";
  mergedOnly?: boolean;
  sort: PortfolioSort;
};

export type PortfolioRepoBreakdown = {
  repoFullName: string;
  count: number;
};

export type PortfolioCadence = {
  /** Oldest -> newest, always exactly 12 entries. */
  months: Array<{ label: string; monthKey: string; count: number }>;
  activeMonths: number;
};
