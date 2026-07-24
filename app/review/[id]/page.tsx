import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ReviewActionsPanel } from "@/components/reviews/review-actions-panel";
import { ReviewTimeline } from "@/components/reviews/review-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  getRequiredApprovals,
  isClaimActive,
  isEligiblePeer,
  loadPeerReviewContext,
} from "@/lib/reviews/community";
import {
  getSubmissionForReview,
  listSubmissionTimeline,
} from "@/lib/reviews/repository";
import { SUBMISSION_STATUS_LABELS } from "@/types/submission";

type ReviewDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ReviewDetailPageProps) {
  const { id } = await params;
  const submission = isDatabaseConfigured()
    ? await getSubmissionForReview(id)
    : null;

  return {
    title: submission
      ? `Review · ${submission.projectTitle}`
      : "Review submission",
  };
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params;
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect(`/sign-in?next=/review/${id}`);
  }

  if (!isDatabaseConfigured()) {
    notFound();
  }

  const submission = await getSubmissionForReview(id, profile.id);

  if (!submission) {
    notFound();
  }

  if (submission.userId === profile.id) {
    redirect(`/projects/${submission.projectSlug}/submit`);
  }

  const ctx = await loadPeerReviewContext(profile.id, profile.role);
  const eligible = isEligiblePeer(ctx, submission);
  const timeline = await listSubmissionTimeline(id);
  const required = submission.requiredApprovals ?? getRequiredApprovals();
  const claimHeldByOther =
    isClaimActive({
      claimedBy: submission.claimedBy,
      claimExpiresAt: submission.claimExpiresAt,
    }) && submission.claimedBy !== profile.id;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-8">
        <Link href="/review">
          <ArrowLeft aria-hidden />
          ls ./review
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-8">
        <div>
          <p className="tech-eyebrow">
            review // {submission.builderDisplayName ?? submission.builderUsername}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-bold tracking-[-0.04em]">
            {submission.projectTitle}
          </h1>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
            Peer reviews need {required} approvals. One request-changes sends
            it back. Staff can approve alone or reject.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {SUBMISSION_STATUS_LABELS[submission.status]}
          </Badge>
          <Badge variant="outline">
            {(submission.approvalCount ?? 0)}/{required} approvals
          </Badge>
          <Badge variant="outline">round {submission.reviewRound}</Badge>
        </div>
      </div>

      {!eligible ? (
        <div className="mt-8 rounded-none border border-border bg-card px-4 py-3 font-mono text-sm text-muted-foreground">
          You are not eligible to review this submission. Complete the same
          project, raise your reputation, or get staff access.
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="space-y-3 rounded-none border border-border bg-card p-5">
            <h2 className="text-lg font-semibold tracking-tight">Submission</h2>
            <Meta
              label="Repository"
              value={submission.repoUrl}
              href={submission.repoUrl}
            />
            <Meta
              label="Live demo"
              value={submission.liveDemoUrl}
              href={submission.liveDemoUrl}
            />
            <Meta
              label="Video demo"
              value={submission.videoDemoUrl}
              href={submission.videoDemoUrl}
            />
            {submission.screenshotUrls.length > 0 ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Screenshots
                </p>
                <ul className="mt-1 space-y-1">
                  {submission.screenshotUrls.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                      >
                        {url}
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {submission.notes ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Builder notes
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {submission.notes}
                </p>
              </div>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${submission.projectSlug}`}>
                View project spec
              </Link>
            </Button>
          </section>

          <section className="rounded-none border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">
              Review timeline
            </h2>
            <ReviewTimeline events={timeline} />
          </section>
        </div>

        <ReviewActionsPanel
          submissionId={submission.id}
          status={submission.status}
          eligible={eligible}
          isStaff={ctx.isStaff}
          claimLocked={claimHeldByOther && !ctx.isStaff}
          approvalCount={submission.approvalCount ?? 0}
          requiredApprovals={required}
          myDecision={submission.myDecision ?? null}
          claimExpiresAt={submission.claimExpiresAt}
          claimedByMe={submission.claimedBy === profile.id}
        />
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {value && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
        >
          {value}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Not provided</p>
      )}
    </div>
  );
}
