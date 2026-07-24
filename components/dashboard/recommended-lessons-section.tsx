import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { RecommendedLessonItem } from "@/types/dashboard";

type RecommendedLessonsSectionProps = {
  lessons: RecommendedLessonItem[];
};

export function RecommendedLessonsSection({
  lessons,
}: RecommendedLessonsSectionProps) {
  if (lessons.length === 0) {
    return null;
  }

  const { visible, hasMore } = takeDashboardItems(lessons, 4);

  return (
    <DashboardSection
      id="recommended-lessons"
      title="Up next"
      description="Best next lessons from your roadmaps."
      action={
        hasMore ? (
          <Link
            href="/roadmaps"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            browse
          </Link>
        ) : null
      }
    >
      <ul className="divide-y divide-border border border-border">
        {visible.map((lesson) => (
          <li key={`${lesson.roadmapSlug}-${lesson.lessonSlug}`}>
            <Link
              href={`/roadmaps/${lesson.roadmapSlug}/lessons/${lesson.lessonSlug}`}
              className="block px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{lesson.title}</p>
                <Badge variant="secondary" className="text-[10px]">
                  {lesson.difficulty}
                </Badge>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {lesson.roadmapTitle} · {lesson.duration}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
