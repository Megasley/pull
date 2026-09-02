export type MilestoneType =
  | "first_opportunity_explored"
  | "first_pr_opened"
  | "first_pr_submitted"
  | "first_pr_merged"
  | "first_verified_contribution";

export const MILESTONE_TYPES: readonly MilestoneType[] = [
  "first_opportunity_explored",
  "first_pr_opened",
  "first_pr_submitted",
  "first_pr_merged",
  "first_verified_contribution",
];

/** A candidate milestone to attempt recording. Idempotency happens at the
 *  DB layer (unique(user_id, milestone_type)) — a candidate for a milestone
 *  the user already has is a safe no-op, not an error. */
export type MilestoneCandidate = {
  userId: string;
  milestoneType: MilestoneType;
  /** ISO timestamp — becomes achieved_at. */
  occurredAt: string;
  repository?: string | null;
  pullRequestUrl?: string | null;
  pullRequestNumber?: number | null;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
};

export type MilestoneEventRecord = {
  id: string;
  userId: string;
  milestoneType: MilestoneType;
  repository: string | null;
  pullRequestUrl: string | null;
  pullRequestNumber: number | null;
  projectId: string | null;
  metadata: Record<string, unknown>;
  achievedAt: string;
};
