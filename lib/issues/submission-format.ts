import type { SubmittedIssueRecord } from "@/lib/issues/submissions";

export const SUBMITTED_ISSUE_STATUS_LABEL: Record<SubmittedIssueRecord["status"], string> = {
  pending: "Pending approval",
  approved: "Live",
  rejected: "Rejected",
  closed: "Closed on GitHub",
};

// Same convention as lib/pr-reviews/format.ts: signal lime only for the
// state worth celebrating (live), everything else neutral.
export const SUBMITTED_ISSUE_STATUS_CLASS: Record<SubmittedIssueRecord["status"], string> = {
  pending: "border-border bg-transparent text-foreground",
  approved: "border-ink/20 bg-signal/25 text-foreground",
  rejected: "border-border bg-muted/50 text-muted-foreground",
  closed: "border-border bg-muted/50 text-muted-foreground",
};
