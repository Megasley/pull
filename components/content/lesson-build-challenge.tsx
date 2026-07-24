import { Hammer } from "lucide-react";

import { cn } from "@/lib/utils";

type LessonBuildChallengeProps = {
  project?: string | null;
  challenge?: string;
  className?: string;
};

export function LessonBuildChallenge({
  project,
  challenge,
  className,
}: LessonBuildChallengeProps) {
  if (!project && !challenge) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-none border border-ink/20 bg-signal/10 p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Hammer className="mt-0.5 size-5 shrink-0 text-ink" />
        <div className="space-y-2">
          <h2 className="tech-eyebrow text-foreground">build // challenge</h2>
          {project ? (
            <p className="font-mono text-xs text-foreground">
              project // {project}
            </p>
          ) : null}
          {challenge ? (
            <p className="text-sm leading-7 text-muted-foreground">{challenge}</p>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              Apply what you learned in a focused build session. Ship something small,
              test it on regtest, and document your approach before moving on.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
