import { Check, Lock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoadmapDifficulty, RoadmapNodeStatus } from "@/types";

const difficultyLabels: Record<RoadmapDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const statusStyles: Record<
  RoadmapNodeStatus,
  { container: string; indicator: string; icon?: React.ReactNode }
> = {
  default: {
    container: "border-border bg-card hover:border-border hover:bg-card",
    indicator: "border-border bg-muted text-muted-foreground",
  },
  active: {
    container: "border-ink bg-ink/5 hover:bg-ink/10",
    indicator: "border-ink bg-ink text-[var(--background)]",
    icon: <Sparkles className="size-3.5" aria-hidden />,
  },
  completed: {
    container: "border-ink/30 bg-signal/15 hover:border-ink/50 hover:bg-signal/25",
    indicator: "border-ink bg-signal text-ink",
    icon: <Check className="size-3.5" aria-hidden />,
  },
  locked: {
    container: "border-border bg-muted/20 opacity-70",
    indicator: "border-border bg-muted/40 text-muted-foreground",
    icon: <Lock className="size-3.5" aria-hidden />,
  },
};

type RoadmapNodeProps = {
  title: string;
  description?: string;
  duration?: string;
  difficulty?: RoadmapDifficulty;
  status?: RoadmapNodeStatus;
  className?: string;
  onClick?: () => void;
};

export function RoadmapNode({
  title,
  description,
  duration,
  difficulty,
  status = "default",
  className,
  onClick,
}: RoadmapNodeProps) {
  const styles = statusStyles[status];
  const isInteractive = status !== "locked" && Boolean(onClick);
  const Comp = isInteractive ? "button" : "div";

  return (
    <Comp
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      disabled={status === "locked"}
      aria-disabled={status === "locked" || undefined}
      className={cn(
        "group relative w-full max-w-xs rounded-none border p-4 text-left transition-all duration-200",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        styles.container,
        isInteractive && "cursor-pointer",
        status === "locked" && "cursor-not-allowed",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-none border transition-colors",
            styles.indicator,
          )}
        >
          {styles.icon ?? (
            <span className="size-2 rounded-full bg-current opacity-60" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            {description ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {duration ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                {duration}
              </Badge>
            ) : null}
            {difficulty ? (
              <Badge variant="secondary" className="text-[10px]">
                {difficultyLabels[difficulty]}
              </Badge>
            ) : null}
            {status === "locked" ? (
              <Badge variant="ghost" className="text-[10px]">
                Locked
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </Comp>
  );
}
