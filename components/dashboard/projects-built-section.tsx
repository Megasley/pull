import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { BuiltProjectItem } from "@/types/dashboard";

type ProjectsBuiltSectionProps = {
  projects: BuiltProjectItem[];
};

export function ProjectsBuiltSection({ projects }: ProjectsBuiltSectionProps) {
  if (projects.length === 0) {
    return null;
  }

  const { visible, total, hasMore } = takeDashboardItems(projects);

  return (
    <DashboardSection
      id="projects-built"
      title="Projects you've built"
      description={`${total} shipped`}
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
        {visible.map((project) => (
          <li key={project.id}>
            <Link
              href={project.href}
              className="flex items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project.title}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {project.projectSlug}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  project.source === "submission"
                    ? "border-ink/20 bg-signal text-ink"
                    : "border-border"
                }
              >
                {project.source === "submission" ? "approved" : "roadmap"}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
