import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { ProjectInProgressItem } from "@/types/dashboard";

type ProjectsInProgressSectionProps = {
  projects: ProjectInProgressItem[];
};

export function ProjectsInProgressSection({
  projects,
}: ProjectsInProgressSectionProps) {
  if (projects.length === 0) {
    return null;
  }

  const { visible, total, hasMore } = takeDashboardItems(projects);

  return (
    <DashboardSection
      id="projects-in-progress"
      title="Projects in progress"
      description={`${total} unlocked build challenge${total === 1 ? "" : "s"}`}
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
      <ul className="space-y-2">
        {visible.map((project) => (
          <li key={`${project.roadmapSlug}-${project.nodeSlug}`}>
            <Link
              href={`/roadmaps/${project.roadmapSlug}/lessons/${project.nodeSlug}`}
              className="block border border-border bg-card p-3 transition-colors hover:border-ink/30 hover:bg-signal/5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{project.title}</p>
                <Badge variant="outline">{project.project}</Badge>
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground capitalize">
                {project.roadmapSlug} · {project.duration} · {project.difficulty}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
