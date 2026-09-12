import Link from "next/link";

import { listMySubmissionsAction } from "@/app/actions/pr-reviews";
import { RestoreSubmissionButton } from "@/components/pr-reviews/restore-submission-button";
import { WithdrawSubmissionButton } from "@/components/pr-reviews/withdraw-submission-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REVIEW_STATUS_CLASS, REVIEW_STATUS_LABEL } from "@/lib/pr-reviews/format";
import { cn } from "@/lib/utils";

// "Withdrawn"/"Removed by admin" read better than the shared generic
// "Hidden" label from the submitter's own point of view — same underlying
// status either way, distinguished by hiddenReason.
function statusLabel(status: string, hiddenReason: string | null): string {
  if (status === "hidden") {
    return hiddenReason === "withdrawn" ? "Withdrawn" : "Removed by admin";
  }
  return REVIEW_STATUS_LABEL[status as keyof typeof REVIEW_STATUS_LABEL];
}

export async function MySubmissions() {
  const result = await listMySubmissionsAction();

  if (!result.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-none border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Sign in to see PRs you&apos;ve submitted for review.
        </p>
        <Button asChild size="sm">
          <Link href="/sign-in?next=/pr-reviews">Sign in</Link>
        </Button>
      </div>
    );
  }

  const submissions = result.requests;

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven&apos;t submitted any PRs for review yet — do that from the Browse tab.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {submissions.map((submission) => (
        <li
          key={submission.id}
          className={cn(
            "flex flex-col gap-3 border-l-4 border-y border-r border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
            submission.status === "reviewed" ? "border-l-signal" : "border-l-ink/15",
          )}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`text-[10px] ${REVIEW_STATUS_CLASS[submission.status]}`}>
                {statusLabel(submission.status, submission.hiddenReason)}
              </Badge>
              <span className="font-mono text-[11px] text-muted-foreground">
                {submission.repoFullName} #{submission.number}
              </span>
            </div>
            <p className="truncate text-sm font-medium text-foreground">{submission.title}</p>
            {submission.status === "reviewed" && submission.reviewedByUsername ? (
              <p className="text-xs text-muted-foreground">
                reviewed by @{submission.reviewedByUsername}
              </p>
            ) : null}
          </div>
          {submission.status === "needs_review" ? (
            <WithdrawSubmissionButton id={submission.id} />
          ) : null}
          {submission.status === "hidden" && submission.hiddenReason === "withdrawn" ? (
            <RestoreSubmissionButton id={submission.id} />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
