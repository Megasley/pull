import Link from "next/link";
import { redirect } from "next/navigation";

import { listAllReviewRequestsAction } from "@/app/actions/pr-reviews";
import { EmptyState, PageHeader } from "@/components/design-system";
import { AdminAddPrForm } from "@/components/pr-reviews/admin-add-pr-form";
import { HideReviewRequestButton } from "@/components/pr-reviews/hide-review-request-button";
import { UnhideReviewRequestButton } from "@/components/pr-reviews/unhide-review-request-button";
import { Badge } from "@/components/ui/badge";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import {
  daysSince,
  formatRelativeTime,
  formatSubmittedByLabel,
  REVIEW_STATUS_CLASS,
  REVIEW_STATUS_LABEL,
  STALE_AFTER_DAYS,
} from "@/lib/pr-reviews/format";
import type { PrReviewRequestRecord } from "@/lib/pr-reviews/repository";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · PR Reviews" };

const STATUS_FILTERS = [
  "needs_review",
  "flagged",
  "stale",
  "reviewed",
  "closed",
  "hidden",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  needs_review: REVIEW_STATUS_LABEL.needs_review,
  flagged: "Flagged",
  stale: `Stale (${STALE_AFTER_DAYS}d+)`,
  reviewed: REVIEW_STATUS_LABEL.reviewed,
  closed: REVIEW_STATUS_LABEL.closed,
  hidden: REVIEW_STATUS_LABEL.hidden,
};

const SOURCE_FILTERS = [
  { value: "peer", label: "Peer submitted" },
  { value: "ecosystem", label: "Ecosystem" },
] as const;
type SourceFilter = (typeof SOURCE_FILTERS)[number]["value"];

function isStatusFilter(value: string | undefined): value is StatusFilter {
  return STATUS_FILTERS.includes(value as StatusFilter);
}

function isSourceFilter(value: string | undefined): value is SourceFilter {
  return SOURCE_FILTERS.some((item) => item.value === value);
}

function isStaleRequest(request: PrReviewRequestRecord) {
  return (
    request.status === "needs_review" &&
    daysSince(request.createdAt) >= STALE_AFTER_DAYS
  );
}

function isFlaggedRequest(request: PrReviewRequestRecord) {
  return request.flaggedForReview && request.status === "needs_review";
}

function matchesStatus(request: PrReviewRequestRecord, status: StatusFilter) {
  if (status === "flagged") return isFlaggedRequest(request);
  if (status === "stale") return isStaleRequest(request);
  return request.status === status;
}

function matchesSource(request: PrReviewRequestRecord, source: SourceFilter) {
  return source === "peer"
    ? request.sourceType === "peer_submitted"
    : request.sourceType !== "peer_submitted";
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default async function AdminPrReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) redirect("/sign-in?next=/admin/pr-reviews");
  if (!isAdminRole(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader eyebrow="admin // access denied" title="Nice try, builder" />
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter = isStatusFilter(params.status) ? params.status : undefined;
  const sourceFilter = isSourceFilter(params.source) ? params.source : undefined;

  const result = await listAllReviewRequestsAction();
  const requests = result.ok ? result.requests : [];
  const openCount = requests.filter(
    (request) => request.status === "needs_review",
  ).length;
  const flaggedCount = requests.filter(isFlaggedRequest).length;
  const staleCount = requests.filter(isStaleRequest).length;

  // Status chip counts respect the source filter so the numbers match what
  // clicking the chip would show.
  const sourceScoped = sourceFilter
    ? requests.filter((request) => matchesSource(request, sourceFilter))
    : requests;
  const visible = statusFilter
    ? sourceScoped.filter((request) => matchesStatus(request, statusFilter))
    : sourceScoped;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // pr reviews"
        title="PR review queue"
        description="Add a PR directly, or manage every request regardless of status. Hide anything that shouldn't be in the public queue, or unhide something that was hidden by mistake. Flagged entries (newer/lower-reputation peer submitters) sort first for a quick look; nothing is gated, this is spot-checking after the fact."
        meta={`${openCount} open${flaggedCount > 0 ? ` · ${flaggedCount} flagged` : ""}${staleCount > 0 ? ` · ${staleCount} stale (${STALE_AFTER_DAYS}d+)` : ""} · ${requests.length} total`}
      />

      <div className="mt-8">
        <AdminAddPrForm />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          All requests
        </p>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap gap-1.5">
            <FilterLink
              label={`All · ${sourceScoped.length}`}
              active={!statusFilter}
              href={buildQuery({ source: sourceFilter })}
            />
            {STATUS_FILTERS.map((status) => (
              <FilterLink
                key={status}
                label={`${STATUS_FILTER_LABEL[status]} · ${
                  sourceScoped.filter((request) => matchesStatus(request, status))
                    .length
                }`}
                active={statusFilter === status}
                href={buildQuery({ status, source: sourceFilter })}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterLink
              label="All sources"
              active={!sourceFilter}
              href={buildQuery({ status: statusFilter })}
            />
            {SOURCE_FILTERS.map((item) => (
              <FilterLink
                key={item.value}
                label={item.label}
                active={sourceFilter === item.value}
                href={buildQuery({ status: statusFilter, source: item.value })}
              />
            ))}
          </div>
        </div>
        {requests.length === 0 ? (
          <EmptyState
            title="Nothing in the queue"
            description="No review requests yet."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No matches"
            description="No review requests match these filters."
          />
        ) : (
          <ol className="space-y-3">
            {visible.map((request) => {
              const submittedByLabel = formatSubmittedByLabel(request);
              const isStale = isStaleRequest(request);
              return (
                <li
                  key={request.id}
                  className={cn(
                    "flex flex-col gap-3 border-l-4 border-y border-r border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
                    request.sourceType === "peer_submitted"
                      ? "border-l-signal"
                      : "border-l-ink/15",
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
                        {request.sourceType === "peer_submitted"
                          ? "Peer submitted"
                          : "Ecosystem"}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          REVIEW_STATUS_CLASS[request.status],
                        )}
                      >
                        {REVIEW_STATUS_LABEL[request.status]}
                      </Badge>
                      {isFlaggedRequest(request) ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Flagged
                        </Badge>
                      ) : null}
                      {isStale ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Stale
                        </Badge>
                      ) : null}
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {request.repoFullName} #{request.number}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        submitted {formatRelativeTime(request.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">
                      {request.title}
                    </p>
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

function FilterLink({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={`/admin/pr-reviews${href}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "border px-2.5 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors",
        active
          ? "border-ink bg-ink text-[var(--background)]"
          : "border-border text-muted-foreground hover:border-ink/40 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
