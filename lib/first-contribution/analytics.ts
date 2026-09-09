import type { FirstContributionProgress } from "./progress";

/** Single source of truth for First Contribution's analytics events, fired
 *  through the existing @vercel/analytics custom-events pipeline (already
 *  mounted in app/layout.tsx) rather than a bespoke event system. Server call
 *  sites use lib/first-contribution/analytics-server.ts; the one client call
 *  site (the final step's "Find a real project" CTA) calls `track` from
 *  "@vercel/analytics" directly. */
export type FirstContributionEventName =
  | "first_contribution_started"
  | "first_contribution_step_completed"
  | "first_contribution_pr_opened"
  | "first_contribution_pr_submitted"
  | "first_contribution_pr_merged"
  | "first_contribution_completed"
  | "first_real_project_clicked";

/**
 * Pure — decides which events a single "mark step complete" call should fire,
 * given the progress snapshots taken immediately before and after the write.
 * No DB or network access, so this is unit-testable in isolation (mirrors
 * derivePrMilestoneCandidates in lib/milestones/pr-signals.ts).
 *
 * `isNewCompletion` gates everything: re-marking an already-completed step
 * (e.g. a duplicate request) must not re-fire "started" or "step completed" —
 * that's the idempotency the phase spec asks for.
 */
export function deriveStepCompletionEvents(
  before: FirstContributionProgress,
  after: FirstContributionProgress,
  isNewCompletion: boolean,
): FirstContributionEventName[] {
  if (!isNewCompletion) {
    return [];
  }

  const events: FirstContributionEventName[] = [];

  if (!before.startedAt) {
    events.push("first_contribution_started");
  }

  events.push("first_contribution_step_completed");

  if (!before.isComplete && after.isComplete) {
    events.push("first_contribution_completed");
  }

  return events;
}
