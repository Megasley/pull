import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { AssignedIssueItem } from "@/types/dashboard";

type AssignedIssuesSectionProps = {
  issues: AssignedIssueItem[];
};

export function AssignedIssuesSection({ issues }: AssignedIssuesSectionProps) {
  if (issues.length === 0) {
    return null;
  }

  const { visible, total, hasMore } = takeDashboardItems(issues);

  return (
    <DashboardSection
      id="assigned-issues"
      title="Assigned issues"
      description={`${total} open`}
      action={
        hasMore ? (
          <Link
            href="/issues"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            view all
          </Link>
        ) : null
      }
    >
      <ul className="divide-y divide-border border border-border border-l-signal">
        {visible.map((issue) => (
          <li key={issue.id}>
            <a
              href={issue.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="block px-3 py-2 transition-colors hover:bg-signal/5"
            >
              <p className="text-sm font-medium">
                {issue.title}{" "}
                <span className="font-mono text-muted-foreground">
                  #{issue.number}
                </span>
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {issue.repoFullName}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
