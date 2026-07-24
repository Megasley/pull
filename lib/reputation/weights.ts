import type { ReputationFactorId } from "@/types/reputation";

/** Bump when weights or targets change. */
export const REPUTATION_VERSION = "v1";

/** Must sum to 100. */
export const REPUTATION_WEIGHTS: Record<ReputationFactorId, number> = {
  merged_pull_requests: 25,
  maintainer_reviews: 10,
  contribution_frequency: 15,
  repository_diversity: 15,
  documentation_contributions: 10,
  issue_discussions: 10,
  code_reviews: 15,
};

export const REPUTATION_TARGETS: Record<ReputationFactorId, number> = {
  merged_pull_requests: 8,
  maintainer_reviews: 20,
  contribution_frequency: 6,
  repository_diversity: 5,
  documentation_contributions: 3,
  issue_discussions: 8,
  code_reviews: 10,
};

export const REPUTATION_MONTHS = 12;
