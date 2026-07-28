import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  getClaimMinutes,
  getRequiredApprovals,
  getReputationThreshold,
  isClaimActive,
  isEligiblePeer,
  loadPeerReviewContext,
} from "@/lib/reviews/community";
import { listReviewQueue } from "@/lib/reviews/repository";
import { SUBMISSION_STATUS_LABELS } from "@/types/submission";

export const metadata = {
  title: "Review queue",
  description: "Review submitted Pull projects.",
};

export default async function ReviewQueuePage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/review");
  }

  const ctx = await loadPeerReviewContext(profile.id, profile.role);
  const allQueue = isDatabaseConfigured()
    ? await listReviewQueue(profile.id)
    : [];
  const queue = ctx.isStaff
    ? allQueue
    : allQueue.filter((item) => item.userId !== profile.id);
  const ownPending = ctx.isStaff
    ? []
    : allQueue.filter((item) => item.userId === profile.id);

  const required = getRequiredApprovals();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="review // queue"
        title="Community review"
        description={`Eligible peers and staff review submissions. Approvals need ${required} peer votes (staff can finalize alone). Claims last ${getClaimMinutes()} minutes.`}
        meta={`open // ${queue.length}`}
      />

      {!ctx.isStaff ? (
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Eligible if you completed the same project, or reputation ≥{" "}
          {getReputationThreshold()} (yours: {ctx.reputation}). Your own
          submissions do not appear here — check status on the project card or
          submit page.
        </p>
      ) : (
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Staff view includes your own test submissions in the queue.
        </p>
      )}

      {ownPending.length > 0 ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">Your submissions</h2>
          {ownPending.map((item) => (
            <div
              key={item.id}
              className="rounded-none border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{item.projectTitle}</p>
                <Badge variant="secondary">
                  {SUBMISSION_STATUS_LABELS[item.status]}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Waiting for a reviewer. Track progress on the{" "}
                <Link
                  href={`/projects/${item.projectSlug}/submit`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  submit page
                </Link>
                .
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt-10 space-y-3">
        {queue.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description={
              ownPending.length > 0
                ? "Nothing for you to review right now. Your submission is listed above."
                : "No submitted projects need review right now."
            }
          />
        ) : (
          queue.map((item) => {
            const eligible = isEligiblePeer(ctx, item);
            const isOwn = item.userId === profile.id;
            const claimed =
              isClaimActive({
                claimedBy: item.claimedBy,
                claimExpiresAt: item.claimExpiresAt,
              }) && item.claimedBy !== profile.id;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.projectTitle}</p>
                    <Badge variant="secondary">
                      {SUBMISSION_STATUS_LABELS[item.status]}
                    </Badge>
                    <Badge variant="outline">
                      {(item.approvalCount ?? 0)}/{item.requiredApprovals ?? required}{" "}
                      approvals
                    </Badge>
                    {claimed ? (
                      <Badge variant="outline">claimed</Badge>
                    ) : null}
                    {!eligible ? (
                      <Badge variant="outline">not eligible</Badge>
                    ) : null}
                    {isOwn ? <Badge variant="outline">yours</Badge> : null}
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.builderDisplayName ?? item.builderUsername ?? "Builder"}
                    {item.repoUrl ? ` · ${item.repoUrl}` : ""}
                  </p>
                </div>
                {eligible ? (
                  <Button asChild>
                    <Link href={`/review/${item.id}`}>./open-review</Link>
                  </Button>
                ) : isOwn && ctx.isStaff ? (
                  <Button asChild variant="outline">
                    <Link href={`/projects/${item.projectSlug}/submit`}>
                      ./your-submit
                    </Link>
                  </Button>
                ) : (
                  <Button disabled variant="outline">
                    ./locked
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
