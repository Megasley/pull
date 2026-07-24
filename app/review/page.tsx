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
  const queue = isDatabaseConfigured()
    ? (await listReviewQueue(profile.id)).filter(
        (item) => item.userId !== profile.id,
      )
    : [];

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
          {getReputationThreshold()} (yours: {ctx.reputation}).
        </p>
      ) : null}

      <div className="mt-10 space-y-3">
        {queue.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="No submitted projects need review right now."
          />
        ) : (
          queue.map((item) => {
            const eligible = isEligiblePeer(ctx, item);
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
