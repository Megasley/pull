import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { ContributingRepoItem } from "@/types/dashboard";

type ContributingReposSectionProps = {
  repos: ContributingRepoItem[];
};

export function ContributingReposSection({
  repos,
}: ContributingReposSectionProps) {
  if (repos.length === 0) {
    return null;
  }

  const { visible, total, hasMore } = takeDashboardItems(repos);

  return (
    <DashboardSection
      id="contributing-repos"
      title="Contributing to"
      description={`${total} active repo${total === 1 ? "" : "s"}`}
      action={
        hasMore ? (
          <Link
            href="/repositories"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            view all
          </Link>
        ) : null
      }
    >
      <ul className="divide-y divide-border border border-border font-mono text-xs">
        {visible.map((repo) => (
          <li key={repo.fullName}>
            <a
              href={repo.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-muted/40"
            >
              <span className="truncate text-foreground">{repo.fullName}</span>
              <span className="shrink-0 text-muted-foreground">
                {repo.openPullRequests} PR · {repo.openIssues} issue
                {repo.openIssues === 1 ? "" : "s"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
