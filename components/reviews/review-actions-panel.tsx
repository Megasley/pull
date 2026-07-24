"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { applyReviewActionAction } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import type { ReviewAction, ReviewDecision } from "@/types/submission";

type ReviewActionsPanelProps = {
  submissionId: string;
  status: string;
  eligible: boolean;
  isStaff: boolean;
  claimLocked: boolean;
  approvalCount: number;
  requiredApprovals: number;
  myDecision: ReviewDecision | null;
  claimExpiresAt: string | null;
  claimedByMe: boolean;
};

export function ReviewActionsPanel({
  submissionId,
  status,
  eligible,
  isStaff,
  claimLocked,
  approvalCount,
  requiredApprovals,
  myDecision,
  claimExpiresAt,
  claimedByMe,
}: ReviewActionsPanelProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: ReviewAction) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await applyReviewActionAction(
        submissionId,
        action,
        comment,
      );

      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push(`/sign-in?next=/review/${submissionId}`);
          return;
        }

        setError(
          "error" in result && result.error
            ? result.error
            : "Could not apply review action.",
        );
        return;
      }

      setMessage(
        action === "approve" && !isStaff
          ? "Approval recorded."
          : "Review updated.",
      );
      setComment("");
      router.refresh();
    });
  }

  const canStart = status === "submitted" || status === "needs_changes" || status === "under_review";
  const canDecide =
    status === "submitted" ||
    status === "under_review" ||
    status === "needs_changes";

  return (
    <div className="space-y-4 rounded-none border border-border bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Review actions</h2>

      <p className="font-mono text-[11px] text-muted-foreground">
        Approvals {approvalCount}/{requiredApprovals}
        {myDecision ? ` · your vote: ${myDecision}` : ""}
        {claimedByMe && claimExpiresAt
          ? ` · claim until ${new Date(claimExpiresAt).toLocaleTimeString()}`
          : ""}
      </p>

      {!eligible ? (
        <p className="rounded-none border border-border px-3 py-2 text-sm text-muted-foreground">
          Not eligible to review this submission.
        </p>
      ) : null}

      {claimLocked ? (
        <p className="rounded-none border border-border px-3 py-2 text-sm text-muted-foreground">
          Another reviewer holds the claim. Wait for it to expire, or ask
          staff.
        </p>
      ) : null}

      <div>
        <label htmlFor="review-comment" className="text-sm font-medium">
          Comment
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Feedback for the builder…"
          disabled={pending || !eligible}
          className="mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Required for request changes / reject. Optional for approve and start
          review.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="rounded-none border border-border bg-transparent px-3 py-2 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canStart ? (
          <Button
            type="button"
            variant="outline"
            loading={pending}
            disabled={!eligible || claimLocked}
            onClick={() => run("start_review")}
          >
            Claim / start
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          loading={pending}
          disabled={!eligible}
          onClick={() => run("comment")}
        >
          Leave comment
        </Button>
        {canDecide ? (
          <>
            <Button
              type="button"
              loading={pending}
              disabled={!eligible || claimLocked}
              onClick={() => run("approve")}
            >
              {isStaff ? "Approve (staff)" : "Approve"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={pending}
              disabled={!eligible || claimLocked}
              onClick={() => run("request_changes")}
            >
              Request changes
            </Button>
            {isStaff ? (
              <Button
                type="button"
                variant="destructive"
                loading={pending}
                disabled={!eligible || claimLocked}
                onClick={() => run("reject")}
              >
                Reject
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
