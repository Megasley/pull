import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { OpenPullRequestItem } from "@/types/dashboard";

type OpenPullRequestsSectionProps = {
  pullRequests: OpenPullRequestItem[];
};

export function OpenPullRequestsSection({
  pullRequests,
}: OpenPullRequestsSectionProps) {
  if (pullRequests.length === 0) {
    return null;
  }

  const { visible, total, hasMore } = takeDashboardItems(pullRequests);

  return (
    <DashboardSection
      id="open-pull-requests"
      title="Open pull requests"
      description={`${total} awaiting review`}
      action={
        hasMore ? (
          <Link
            href="/activity"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            view all
          </Link>
        ) : null
      }
    >
      <ul className="divide-y divide-border border border-border border-l-signal">
        {visible.map((pr) => (
          <li key={pr.id}>
            <a
              href={pr.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="block px-3 py-2 transition-colors hover:bg-signal/5"
            >
              <p className="text-sm font-medium">
                {pr.title}{" "}
                <span className="font-mono text-muted-foreground">#{pr.number}</span>
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {pr.repoFullName} · {pr.reviewComments} comment
                {pr.reviewComments === 1 ? "" : "s"}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
