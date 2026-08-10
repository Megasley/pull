export type ContributionType =
  "documentation" | "bug_fix" | "feature" | "test" | "refactor" | "chore" | "other";

export type PullRequestPortfolioStatus = "merged" | "open" | "closed";

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

export type PortfolioFilters = {
  query: string;
  status: PullRequestPortfolioStatus | "all";
  language: string | "all";
  contributionType: ContributionType | "all";
  mergedOnly?: boolean;
};
