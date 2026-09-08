export type ContributionType =
  "documentation" | "bug_fix" | "feature" | "test" | "refactor" | "chore" | "other";

export type PullRequestPortfolioStatus = "merged" | "open" | "closed";

export type PortfolioSort = "recent" | "merged" | "impact";

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
