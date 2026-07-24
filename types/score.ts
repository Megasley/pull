export type BuilderScoreFactorId =
  | "projects_completed"
  | "projects_approved"
  | "roadmaps_completed"
  | "open_source_contributions"
  | "community_reviews"
  | "contribution_consistency";

export type BuilderScoreStrength =
  | "emerging"
  | "building"
  | "strong"
  | "exceptional";

export type BuilderScoreFactor = {
  id: BuilderScoreFactorId;
  label: string;
  description: string;
  /** 0-100 how developed this factor is for the builder (not weight share). */
  strengthPercent: number;
  strength: BuilderScoreStrength;
};

export type BuilderScoreInputs = {
  projectsCompleted: number;
  projectsApproved: number;
  roadmapsCompleted: number;
  openSourceContributions: number;
  communityReviews: number;
  /** Distinct weeks with activity in the consistency window. */
  activeWeeks: number;
};

export type BuilderScoreResult = {
  /** Final Builder Score from 0-100. */
  score: number;
  /** Internal weight version - not shown as a formula. */
  version: string;
  summary: string;
  factors: BuilderScoreFactor[];
  inputs: BuilderScoreInputs;
};
