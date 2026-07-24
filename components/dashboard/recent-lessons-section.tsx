import Link from "next/link";
import { Clock3 } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { takeDashboardItems } from "@/lib/dashboard/list-limit";
import type { RecentLessonItem } from "@/types/dashboard";

type RecentLessonsSectionProps = {
  lessons: RecentLessonItem[];
};

function formatCompletedAt(value: string | null) {
  if (!value) {
    return "Recently completed";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function RecentLessonsSection({ lessons }: RecentLessonsSectionProps) {
  if (lessons.length === 0) {
    return null;
  }

  const { visible, total, hasMore } = takeDashboardItems(lessons);

  return (
    <DashboardSection
      id="recent-lessons"
      title="Recent lessons"
      description={`${total} completed recently`}
      action={
        hasMore ? (
          <Link
            href="/roadmaps"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            view all
          </Link>
        ) : null
      }
    >
      <ul className="divide-y divide-border border border-border">
        {visible.map((lesson) => (
          <li key={`${lesson.roadmapSlug}-${lesson.lessonSlug}`}>
            <Link
              href={`/roadmaps/${lesson.roadmapSlug}/lessons/${lesson.lessonSlug}`}
              className="group flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium group-hover:underline">
                  {lesson.title}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground capitalize">
                  {lesson.roadmapSlug}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground">
                <Clock3 className="size-3" aria-hidden />
                {formatCompletedAt(lesson.completedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardSection>
  );
}
