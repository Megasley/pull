import type { BuilderScoreFactorId } from "@/types/score";

/**
 * Internal scoring configuration.
 * Bump `version` when weights or saturation targets change.
 * Do not expose these numbers in the UI.
 */
export const BUILDER_SCORE_VERSION = "v1";

/** Relative importance of each factor. Must sum to 100. */
export const BUILDER_SCORE_WEIGHTS: Record<BuilderScoreFactorId, number> = {
  projects_completed: 20,
  projects_approved: 25,
  roadmaps_completed: 15,
  open_source_contributions: 20,
  community_reviews: 10,
  contribution_consistency: 10,
};

/**
 * Raw counts that map to a full (1.0) factor signal.
 * Uses soft saturation so early progress moves the needle and late gains taper.
 */
export const BUILDER_SCORE_TARGETS: Record<BuilderScoreFactorId, number> = {
  projects_completed: 8,
  projects_approved: 5,
  roadmaps_completed: 2,
  open_source_contributions: 5,
  community_reviews: 10,
  contribution_consistency: 6,
};

/** Look-back window for consistency. */
export const CONSISTENCY_WINDOW_WEEKS = 8;
