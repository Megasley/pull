"use client";

import { cn } from "@/lib/utils";

type LessonReadingProgressProps = {
  progress: number;
};

export function LessonReadingProgress({ progress }: LessonReadingProgressProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-14 z-[60] h-0.5 bg-border/40"
    >
      <div
        className={cn(
          "h-full bg-foreground transition-[width] duration-150 ease-out",
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
