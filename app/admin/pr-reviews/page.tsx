import { redirect } from "next/navigation";

import { listAllReviewRequestsAction } from "@/app/actions/pr-reviews";
import { EmptyState, PageHeader } from "@/components/design-system";
import { AdminAddPrForm } from "@/components/pr-reviews/admin-add-pr-form";
import { HideReviewRequestButton } from "@/components/pr-reviews/hide-review-request-button";
import { UnhideReviewRequestButton } from "@/components/pr-reviews/unhide-review-request-button";
import { Badge } from "@/components/ui/badge";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { formatSubmittedByLabel, REVIEW_STATUS_CLASS, REVIEW_STATUS_LABEL } from "@/lib/pr-reviews/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · PR Reviews" };

export default async function AdminPrReviewsPage() {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) redirect("/sign-in?next=/admin/pr-reviews");
  if (!isAdminRole(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader eyebrow="admin // access denied" title="Nice try, builder" />
      </div>
    );
  }

  const result = await listAllReviewRequestsAction();
  const requests = result.ok ? result.requests : [];
  const openCount = requests.filter((request) => request.status === "needs_review").length;
  const flaggedCount = requests.filter(
    (request) => request.flaggedForReview && request.status === "needs_review",
  ).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // pr reviews"
        title="PR review queue"
        description="Add a PR directly, or manage every request regardless of status — hide anything that shouldn't be in the public queue, or unhide something that was hidden by mistake. Flagged entries (newer/lower-reputation peer submitters) sort first for a quick look; nothing is gated, this is spot-checking after the fact."
        meta={`${openCount} open${flaggedCount > 0 ? ` · ${flaggedCount} flagged` : ""} · ${requests.length} total`}
      />

      <div className="mt-8">
        <AdminAddPrForm />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          All requests
        </p>
        {requests.length === 0 ? (
          <EmptyState title="Nothing in the queue" description="No review requests yet." />
        ) : (
          <ol className="space-y-3">
            {requests.map((request) => {
              const submittedByLabel = formatSubmittedByLabel(request);
              return (
                <li
                  key={request.id}
                  className={cn(
                    "flex flex-col gap-3 border-l-4 border-y border-r border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
                    request.sourceType === "peer_submitted" ? "border-l-signal" : "border-l-ink/15",
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          "text-[10px]",
                          request.sourceType === "peer_submitted"
                            ? "border-ink/20 bg-signal/20 text-foreground"
                            : "border-border bg-muted/50 text-muted-foreground",
                        )}
                      >
                        {request.sourceType === "peer_submitted" ? "Peer submitted" : "Ecosystem"}
                      </Badge>
                      <Badge className={cn("text-[10px]", REVIEW_STATUS_CLASS[request.status])}>
                        {REVIEW_STATUS_LABEL[request.status]}
                      </Badge>
                      {request.flaggedForReview && request.status === "needs_review" ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Flagged
                        </Badge>
                      ) : null}
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {request.repoFullName} #{request.number}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">{request.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by @{request.authorLogin}
                      {submittedByLabel ? ` · ${submittedByLabel}` : ""}
                    </p>
                  </div>
                  {request.status === "hidden" ? (
                    <UnhideReviewRequestButton id={request.id} />
                  ) : (
                    <HideReviewRequestButton id={request.id} />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
