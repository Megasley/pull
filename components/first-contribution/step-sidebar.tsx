import Link from "next/link";

import { CheckIcon } from "@/components/icons/outline-icons";
import { ACCENT_STYLES } from "@/lib/first-contribution/step-accent";
import { STEP_ICONS } from "@/lib/first-contribution/step-icon";
import type { FirstContributionStep } from "@/lib/first-contribution/steps";
import { cn } from "@/lib/utils";

type StepSidebarProps = {
  steps: readonly FirstContributionStep[];
  completedSlugs: readonly string[];
  currentSlug: string;
};

/** Persistent step nav shown alongside a step's content on wide viewports
 *  (hidden below lg — mobile/tablet keep the existing Back/Continue flow
 *  and the landing page's own journey list). Lets someone jump straight to
 *  any step instead of walking Back/Continue one at a time, and puts the
 *  wide desktop viewport to use instead of leaving it as empty margin. */
export function StepSidebar({ steps, completedSlugs, currentSlug }: StepSidebarProps) {
  const completedCount = completedSlugs.length;

  return (
    <nav
      aria-label="First Contribution steps"
      className="top-20 hidden self-start lg:sticky lg:block"
    >
      <p className="tech-eyebrow">
        {completedCount} of {steps.length} complete
      </p>
      <ol className="mt-3 space-y-1">
        {steps.map((step) => {
          const isComplete = completedSlugs.includes(step.slug);
          const isCurrent = step.slug === currentSlug;
          const Icon = STEP_ICONS[step.icon];

          return (
            <li key={step.slug}>
              <Link
                href={`/first-contribution/${step.slug}`}
                title={step.title}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 border border-transparent px-2 py-1.5 text-sm transition-colors hover:bg-muted/40",
                  isCurrent && "border-ink bg-ink/5 font-medium",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center border",
                    isComplete
                      ? "border-ink bg-signal text-signal-foreground"
                      : ACCENT_STYLES[step.accent].badge,
                  )}
                >
                  {isComplete ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <Icon className="size-3" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate",
                    isComplete && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
