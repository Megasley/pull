import type {
  ExistingPullRequestForSync,
  PullRequestSyncInput,
} from "@/lib/github/store";
import type { MilestoneCandidate } from "./types";

export type PrSyncResult = {
  input: PullRequestSyncInput;
  pullRequestId: string;
  previous: ExistingPullRequestForSync | null;
};

/**
 * Pure derivation of PR-based milestone candidates from a sync batch — no
 * DB access, so this is fully unit-testable. Mirrors the transition logic
 * in lib/github/store.ts:deriveLifecycleEvents (same inputs), but emits
 * milestone candidates with the repo/PR context admin notifications need,
 * rather than the lifecycle-event rows that feed the contribution timeline.
 *
 * "Submitted" fires on either a real draft->ready transition this sync
 * observed, or a brand-new PR discovered already non-draft (it never went
 * through a draft phase Pull witnessed) — the milestone is about the PR
 * being ready for review, not about literally catching the transition.
 */
export function derivePrMilestoneCandidates(
  results: PrSyncResult[],
  userId: string,
): MilestoneCandidate[] {
  const candidates: MilestoneCandidate[] = [];

  for (const { input, previous } of results) {
    const base = {
      userId,
      repository: input.repoFullName,
      pullRequestUrl: input.htmlUrl,
      pullRequestNumber: input.number,
    };

    const isNew = !previous;

    if (isNew && input.githubCreatedAt) {
      candidates.push({
        ...base,
        milestoneType: "first_pr_opened",
        occurredAt: input.githubCreatedAt,
      });
    }

    const transitionedToReady = previous
      ? previous.draft && input.enriched && !input.draft
      : false;
    const discoveredReady = isNew && !input.draft;

    if (transitionedToReady || discoveredReady) {
      candidates.push({
        ...base,
        milestoneType: "first_pr_submitted",
        // No exact "became ready" timestamp exists (same reasoning as the
        // ready_for_review lifecycle event) — use the discovery/observation
        // time, not an invented one.
        occurredAt: input.githubCreatedAt ?? new Date().toISOString(),
      });
    }

    const justMerged = previous ? !previous.merged && input.merged : input.merged;

    if (justMerged && input.githubMergedAt) {
      candidates.push({
        ...base,
        milestoneType: "first_pr_merged",
        occurredAt: input.githubMergedAt,
      });

      if (!input.isOwnRepo) {
        candidates.push({
          ...base,
          milestoneType: "first_verified_contribution",
          occurredAt: input.githubMergedAt,
        });
      }
    }
  }

  return candidates;
}
