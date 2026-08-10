import Link from "next/link";
import { Hammer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LessonBuildChallengeProps = {
  project?: string | null;
  challenge?: string;
  recommendedProjects?: string[];
  className?: string;
};

export function LessonBuildChallenge({
  project,
  challenge,
  recommendedProjects = [],
  className,
}: LessonBuildChallengeProps) {
  const projects = [
    ...(project ? [project] : []),
    ...recommendedProjects.filter((slug) => slug !== project),
  ];

  if (projects.length === 0 && !challenge) {
    return null;
  }

  return (
    <section
      className={cn("rounded-none border border-ink/20 bg-signal/10 p-6", className)}
    >
      <div className="flex items-start gap-3">
        <Hammer className="mt-0.5 size-5 shrink-0 text-ink" />
        <div className="space-y-3">
          <h2 className="tech-eyebrow text-foreground">build // challenge</h2>
          {projects.map((slug) => (
            <div
              key={slug}
              className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-3 py-2.5"
            >
              <p className="font-mono text-xs text-foreground">project // {slug}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/projects/${slug}`}>./open-spec</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/projects/${slug}/submit`}>./submit</Link>
                </Button>
              </div>
            </div>
          ))}
          {challenge ? (
            <p className="text-sm leading-7 text-muted-foreground">{challenge}</p>
          ) : projects.length > 0 ? (
            <p className="text-sm leading-7 text-muted-foreground">
              Apply what you learned in a focused build session. Ship something small,
              test it on regtest, and document your approach before moving on.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
