import Link from "next/link";

import { CheckIcon, SparklesIcon } from "@/components/icons/outline-icons";
import { SectionHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { ACCENT_STYLES } from "@/lib/first-contribution/step-accent";
import { STEP_ICONS } from "@/lib/first-contribution/step-icon";
import type { FirstContributionStep } from "@/lib/first-contribution/steps";
import { cn } from "@/lib/utils";

type JourneyOverviewProps = {
  steps: readonly FirstContributionStep[];
  completedSlugs?: readonly string[];
  /** The single step to resume at, highlighted the same way RoadmapNode
   *  marks an "active" node (see components/design-system/roadmap-node.tsx),
   *  so a beginner scanning the list doesn't have to compare step numbers
   *  against their own memory to find where they left off. */
  nextSlug?: string;
  className?: string;
};

export function JourneyOverview({
  steps,
  completedSlugs = [],
  nextSlug,
  className,
}: JourneyOverviewProps) {
  return (
    <div className={cn("py-16", className)}>
      <SectionHeader
        eyebrow="roadmap // 10 steps"
        title="Your path to a merged pull request"
        description="Each step is short and hands-on. You'll go from reading about open source to opening a real pull request on a practice repository built for beginners."
        className="mb-10"
      />

      <ol className="flex flex-col gap-3">
        {steps.map((step) => {
          const isComplete = completedSlugs.includes(step.slug);
          const isNext = !isComplete && step.slug === nextSlug;
          const Icon = STEP_ICONS[step.icon];

          return (
            <li key={step.slug}>
              <Link
                href={`/first-contribution/${step.slug}`}
                className={cn(
                  "flex items-center gap-4 border border-border bg-card px-4 py-3.5 transition-colors hover:border-ink/40 hover:bg-muted/20 sm:gap-5 sm:px-5",
                  isComplete && "border-ink/30 bg-signal/10 hover:border-ink/50 hover:bg-signal/20",
                  isNext && "border-ink bg-ink/5 hover:bg-ink/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center border",
                    isComplete
                      ? "border-ink bg-signal text-signal-foreground"
                      : isNext
                        ? "border-ink bg-ink text-[var(--background)]"
                        : ACCENT_STYLES[step.accent].badge,
                  )}
                >
                  {isComplete ? (
                    <CheckIcon className="size-3.5" />
                  ) : isNext ? (
                    <SparklesIcon className="size-3.5" />
                  ) : (
                    <Icon className="size-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                    Step {String(step.order).padStart(2, "0")}
                  </p>
                  <p className="text-sm font-medium text-foreground sm:text-base">
                    {step.title}
                  </p>
                </div>
                {isNext ? (
                  <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                    Continue here
                  </Badge>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
