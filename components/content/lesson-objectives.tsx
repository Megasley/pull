import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LessonObjectivesProps = {
  objectives: string[];
  className?: string;
};

export function LessonObjectives({ objectives, className }: LessonObjectivesProps) {
  if (objectives.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-none border border-border bg-card p-6",
        className,
      )}
    >
      <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Learning objectives
      </h2>
      <ul className="mt-4 space-y-3">
        {objectives.map((objective) => (
          <li key={objective} className="flex items-start gap-3 text-sm leading-6">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink" />
            <span className="text-foreground/90">{objective}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
