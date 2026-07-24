export type ReputationFactorId =
  | "merged_pull_requests"
  | "maintainer_reviews"
  | "contribution_frequency"
  | "repository_diversity"
  | "documentation_contributions"
  | "issue_discussions"
  | "code_reviews";

export type ReputationStrength =
  | "emerging"
  | "building"
  | "strong"
  | "exceptional";

export type ReputationFactor = {
  id: ReputationFactorId;
  label: string;
  description: string;
  strengthPercent: number;
  strength: ReputationStrength;
  raw: number;
};

export type ReputationInputs = {
  mergedPullRequests: number;
  maintainerReviewComments: number;
  activeMonths: number;
  uniqueRepos: number;
  documentationContributions: number;
  issueDiscussions: number;
  codeReviews: number;
};

export type ReputationMonthPoint = {
  key: string;
  label: string;
  merged: number;
  opened: number;
  issues: number;
  reviews: number;
  total: number;
};

export type ReputationMilestone = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
};

export type ReputationResult = {
  score: number;
  version: string;
  summary: string;
  factors: ReputationFactor[];
  inputs: ReputationInputs;
  monthly: ReputationMonthPoint[];
  milestones: ReputationMilestone[];
};
