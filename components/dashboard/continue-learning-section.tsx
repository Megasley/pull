import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ContinueLearningItem } from "@/types/dashboard";

type ContinueLearningSectionProps = {
  item: ContinueLearningItem | null;
};

export function ContinueLearningSection({ item }: ContinueLearningSectionProps) {
  if (!item) {
    return (
      <EmptyState
        icon={<BookOpen className="size-5" aria-hidden />}
        title="Start your builder journey"
        description="Pick a roadmap and complete your first lesson to unlock personalized recommendations."
        actionLabel="ls ./roadmaps"
        actionHref="/roadmaps"
      />
    );
  }

  const href = `/roadmaps/${item.roadmapSlug}/lessons/${item.lessonSlug}`;

  return (
    <div className="relative overflow-hidden rounded-none border border-ink/25 bg-signal/15 p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-signal"
        aria-hidden
      />
      <div className="relative z-10 max-w-2xl space-y-4">
        <p className="font-mono text-[11px] tracking-[0.14em] text-ink uppercase">
          Continue learning
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{item.roadmapTitle}</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {item.lessonTitle}
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{item.difficulty}</Badge>
          <span className="text-sm text-muted-foreground">{item.duration}</span>
        </div>
        <Button asChild className="mt-2">
          <Link href={href}>
            ./continue-lesson
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
