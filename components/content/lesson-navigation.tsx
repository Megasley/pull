import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LessonNavigation } from "@/types/content";

type LessonNavigationProps = {
  roadmapSlug: string;
  navigation: LessonNavigation;
};

export function LessonNavigationBar({
  roadmapSlug,
  navigation,
}: LessonNavigationProps) {
  const { previous, next } = navigation;

  if (!previous && !next) {
    return null;
  }

  return (
    <div className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
      {previous ? (
        <Button
          variant="outline"
          className="h-auto min-w-0 w-full justify-start whitespace-normal py-4"
          asChild
        >
          <Link href={`/roadmaps/${roadmapSlug}/lessons/${previous.slug}`}>
            <span className="flex min-w-0 items-start gap-3 text-left">
              <ArrowLeft className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  prev
                </span>
                <span className="block break-words font-medium">{previous.title}</span>
              </span>
            </span>
          </Link>
        </Button>
      ) : (
        <div className="hidden sm:block" />
      )}

      {next ? (
        <Button
          variant="outline"
          className="h-auto min-w-0 w-full justify-end whitespace-normal py-4 sm:col-start-2"
          asChild
        >
          <Link href={`/roadmaps/${roadmapSlug}/lessons/${next.slug}`}>
            <span className="flex min-w-0 items-start gap-3 text-right">
              <span className="min-w-0">
                <span className="block font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  next
                </span>
                <span className="block break-words font-medium">{next.title}</span>
              </span>
              <ArrowRight className="mt-0.5 size-4 shrink-0" />
            </span>
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
