import { cn } from "@/lib/utils";
import type { RoadmapProgress } from "@/types/roadmap";

type RoadmapProgressBarProps = {
  progress: RoadmapProgress;
  className?: string;
  /** Eyebrow tag above the bar — override for non-roadmap callers (e.g.
   *  First Contribution, which calls this "the journey", never "a roadmap"). */
  label?: string;
  /** Screen-reader label for the progress element — kept in sync with `label`
   *  by default so assistive tech uses the same terminology as the visible tag. */
  ariaLabel?: string;
};

export function RoadmapProgressBar({
  progress,
  className,
  label = "progress // roadmap",
  ariaLabel = "Roadmap completion progress",
}: RoadmapProgressBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="tech-eyebrow">{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {progress.completed}/{progress.total} · {progress.percentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        className="h-1.5 overflow-hidden rounded-none bg-muted"
      >
        <div
          className="h-full rounded-none bg-ink transition-[width] duration-500 ease-out"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </div>
  );
}
