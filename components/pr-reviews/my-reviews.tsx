import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { listMyReviewsAction } from "@/app/actions/pr-reviews";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/pr-reviews/format";

export async function MyReviews() {
  const result = await listMyReviewsAction();

  if (!result.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-none border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Sign in to see PRs you&apos;ve reviewed.
        </p>
        <Button asChild size="sm">
          <Link href="/sign-in?next=/pr-reviews">Sign in</Link>
        </Button>
      </div>
    );
  }

  const reviews = result.requests;

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven&apos;t reviewed anything from the queue yet. Pick something up from the Browse
        tab. Credit shows up here once your GitHub sync picks up the review (or use &quot;I
        reviewed this&quot; on a card for an immediate check).
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="flex flex-col gap-3 border-l-4 border-y border-r border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between border-l-signal"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                {review.repoFullName} #{review.number}
              </span>
              {review.reviewedAt ? (
                <span className="text-[11px] text-muted-foreground">
                  reviewed {formatRelativeTime(review.reviewedAt)}
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm font-medium text-foreground">{review.title}</p>
            <p className="text-xs text-muted-foreground">by @{review.authorLogin}</p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <a href={review.prUrl} target="_blank" rel="noreferrer">
              View on GitHub
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Button>
        </li>
      ))}
    </ol>
  );
}
