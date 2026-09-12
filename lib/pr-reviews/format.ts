import type { PrReviewRequestRecord } from "@/lib/pr-reviews/repository";

/**
 * "submitted by" label for a request — an admin-curated entry always reads
 * as "submitted by admin" (the platform curating it, not a specific admin's
 * identity) rather than naming whichever admin happened to click the button;
 * a peer submission names the actual builder who asked for help. Returns
 * null when there's nothing to show (pure auto-discovery, no human involved).
 *
 * Deliberately its own file, not lib/pr-reviews/repository.ts: that module
 * has server-only DB imports at the top, and this needs to be safely
 * importable from the client component that renders the public queue
 * (components/pr-reviews/pr-review-queue.tsx) — a `import type` of
 * PrReviewRequestRecord is erased at compile time and safe, but a real
 * value import of anything from repository.ts pulls the whole module (and
 * `postgres`) into the client bundle.
 */
export function formatSubmittedByLabel(
  record: Pick<PrReviewRequestRecord, "sourceType" | "submittedByUsername">,
): string | null {
  if (!record.submittedByUsername) {
    return null;
  }
  return record.sourceType === "admin_curated"
    ? "submitted by admin"
    : `submitted by @${record.submittedByUsername}`;
}

export const REVIEW_STATUS_LABEL: Record<PrReviewRequestRecord["status"], string> = {
  needs_review: "Needs review",
  reviewed: "Reviewed",
  closed: "Closed",
  hidden: "Hidden",
};

// Signal lime marks the one state worth celebrating (someone reviewed it);
// everything else stays neutral so that highlight actually stands out.
export const REVIEW_STATUS_CLASS: Record<PrReviewRequestRecord["status"], string> = {
  needs_review: "border-border bg-transparent text-foreground",
  reviewed: "border-ink/20 bg-signal/25 text-foreground",
  closed: "border-border bg-muted/50 text-muted-foreground",
  hidden: "border-border bg-muted/50 text-muted-foreground",
};
