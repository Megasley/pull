import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { ReviewReceivedItem } from "@/types/dashboard";

type ReviewsReceivedSectionProps = {
  reviews: ReviewReceivedItem[];
};

function decisionLabel(decision: string) {
  switch (decision) {
    case "approve":
      return "approved";
    case "request_changes":
      return "changes requested";
    case "reject":
      return "rejected";
    default:
      return decision;
  }
}

function decisionClass(decision: string) {
  switch (decision) {
    case "approve":
      return "border-ink/20 bg-signal text-ink";
    case "request_changes":
      return "border-amber-600/30 bg-amber-500/15 text-amber-800 dark:text-amber-200";
    case "reject":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function ReviewsReceivedSection({ reviews }: ReviewsReceivedSectionProps) {
  if (reviews.length === 0) {
    return null;
  }

  const { visible, total, hasMore } = takeDashboardItems(reviews);

  return (
    <DashboardSection
      id="reviews-received"
      title="Reviews received"
      description={`${total} on project submissions`}
      action={
        hasMore ? (
          <Link
            href="/projects"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            view all
          </Link>
        ) : null
      }
    >
      <ul className="divide-y divide-border border border-border">
        {visible.map((review) => (
          <li key={review.id}>
            <Link
              href={review.href}
              className="block px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{review.projectTitle}</p>
                <Badge variant="outline" className={decisionClass(review.decision)}>
                  {decisionLabel(review.decision)}
                </Badge>
              </div>
              {review.body.trim() ? (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {review.body}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
