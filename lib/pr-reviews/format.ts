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

// Muted, desaturated hues (not raw language-brand colors) so a row of
// language dots stays calm next to this site's restrained "flat paper, warm
// ink, electric signal lime" palette instead of turning into a rainbow.
// Shown as a small dot next to the language name, not a colored badge
// background — color stays a quiet accent, not the dominant signal.
const LANGUAGE_DOT_COLOR: Record<string, string> = {
  JavaScript: "#c9a227",
  TypeScript: "#3b6ea5",
  Python: "#4a7a8c",
  Rust: "#b5651d",
  Go: "#4a9b8e",
  C: "#6b6f8c",
  "C++": "#a15c7a",
  "C#": "#7a5ca1",
  Scala: "#a13d3d",
};
const LANGUAGE_DOT_FALLBACK = "#8a8680";

export function languageDotColor(language: string): string {
  return LANGUAGE_DOT_COLOR[language] ?? LANGUAGE_DOT_FALLBACK;
}

/** Rough "how big a bite is this" signal — lets a first-time reviewer
 *  self-select something approachable instead of gambling on a title
 *  alone. Buckets match the common convention used by PR-size-label bots
 *  (roughly: XS<10, S<30, M<100, L<500, XL 500+ changed lines). */
export type PrSizeLabel = "XS" | "S" | "M" | "L" | "XL";

export function prSizeLabel(additions: number, deletions: number): PrSizeLabel {
  const total = additions + deletions;
  if (total < 10) return "XS";
  if (total < 30) return "S";
  if (total < 100) return "M";
  if (total < 500) return "L";
  return "XL";
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diffMs)) return "";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** A needs_review row this old is more likely stale/abandoned than
 *  genuinely still being worked toward — used to flag it for an admin
 *  rather than let it silently accumulate. */
export const STALE_AFTER_DAYS = 30;

export function daysSince(iso: string): number {
  const diffMs = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diffMs)) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
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
