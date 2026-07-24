import Link from "next/link";
import { ExternalLink, GitBranch } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { OpenSourceOpportunity } from "@/types/dashboard";

type OpenSourceOpportunitiesSectionProps = {
  opportunities: OpenSourceOpportunity[];
};

export function OpenSourceOpportunitiesSection({
  opportunities,
}: OpenSourceOpportunitiesSectionProps) {
  if (opportunities.length === 0) {
    return null;
  }

  const { visible, hasMore } = takeDashboardItems(opportunities, 3);

  return (
    <DashboardSection
      id="suggested-next-contribution"
      title="Suggested next contribution"
      description="Matched from roadmaps, languages, and GitHub activity."
      action={
        <Link
          href="/issues"
          className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
        >
          {hasMore ? "browse more" : "browse issues"}
        </Link>
      }
    >
      <ul className="space-y-2">
        {visible.map((opportunity) => (
          <li key={opportunity.id}>
            <a
              href={opportunity.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start justify-between gap-3 border border-border bg-card p-3 transition-colors hover:border-ink/30"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium group-hover:underline">
                  {opportunity.title}
                </p>
                <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <GitBranch className="size-3" aria-hidden />
                  {opportunity.repository}
                </p>
              </div>
              <ExternalLink
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
