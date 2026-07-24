import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import type { RoadmapProgressSummary } from "@/types/progress";

type RoadmapProgressSectionProps = {
  summaries: RoadmapProgressSummary[];
};

export function RoadmapProgressSection({ summaries }: RoadmapProgressSectionProps) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <DashboardSection
      id="roadmap-progress"
      title="Roadmap progress"
      description="Synced across devices."
    >
      <div className="grid gap-3">
        {summaries.map((summary) => (
          <article
            key={summary.roadmapSlug}
            className="border border-border bg-card p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold">{summary.title}</h3>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {summary.completed}/{summary.total} · {summary.percentage}%
                </p>
              </div>

              {summary.resumeLessonSlug ? (
                <Button asChild size="sm" className="shrink-0">
                  <Link
                    href={`/roadmaps/${summary.roadmapSlug}/lessons/${summary.resumeLessonSlug}`}
                  >
                    Resume
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={`/roadmaps/${summary.roadmapSlug}`}>Review</Link>
                </Button>
              )}
            </div>

            <div className="mt-3 h-1.5 overflow-hidden bg-muted/60">
              <div
                className="h-full bg-signal transition-[width] duration-300"
                style={{ width: `${summary.percentage}%` }}
                role="progressbar"
                aria-valuenow={summary.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${summary.title} progress`}
              />
            </div>

            {summary.completedProjects.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {summary.completedProjects.map((project) => (
                  <li
                    key={project.slug}
                    className="border border-ink/20 bg-signal/20 px-2 py-0.5 font-mono text-[10px] text-ink"
                  >
                    {project.title}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </DashboardSection>
  );
}
