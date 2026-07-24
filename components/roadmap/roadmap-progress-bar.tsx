import { cn } from "@/lib/utils";
import type { RoadmapProgress } from "@/types/roadmap";

type RoadmapProgressBarProps = {
  progress: RoadmapProgress;
  className?: string;
};

export function RoadmapProgressBar({ progress, className }: RoadmapProgressBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="tech-eyebrow">progress // roadmap</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {progress.completed}/{progress.total} · {progress.percentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Roadmap completion progress"
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
