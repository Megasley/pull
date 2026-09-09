"use client";

import { track } from "@vercel/analytics";
import { CheckCircle2, FlaskConical, Lightbulb, ListChecks } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useState, useTransition } from "react";

import {
  setFirstContributionStepCompletionAction,
  type UnlockedAchievementSummary,
} from "@/app/actions/first-contribution";
import { ExternalLinkIcon } from "@/components/icons/outline-icons";
import { FirstContributionCelebration } from "@/components/first-contribution/achievement-celebration";
import { InlineText } from "@/components/first-contribution/inline-text";
import { StepChecklist } from "@/components/first-contribution/step-checklist";
import { StepCodeBlock } from "@/components/first-contribution/step-code-block";
import { Button } from "@/components/ui/button";
import { ACCENT_STYLES } from "@/lib/first-contribution/step-accent";
import { STEP_ICONS } from "@/lib/first-contribution/step-icon";
import type { FirstContributionStep } from "@/lib/first-contribution/steps";
import { cn } from "@/lib/utils";

type FirstContributionStepViewProps = {
  step: FirstContributionStep;
  totalSteps: number;
  previousHref?: string;
  nextHref?: string;
  /** Overrides the default "Continue" label — e.g. the last step links elsewhere. */
  continueLabel?: string;
  /** True on the last step, whose continue button leaves First Contribution
   *  for Pull's real project discovery — fires first_real_project_clicked. */
  isFinalStep?: boolean;
  isAuthenticated: boolean;
  initialCompleted: boolean;
};

/** Section header used for "What you'll learn" / "Do this" / "Try it" /
 *  "Check your work": a fixed color per section type (not tied to the
 *  step's own accent, see lib/first-contribution/step-accent.ts) so the
 *  same icon+color reads consistently across every one of the 10 steps. */
function SectionLabel({
  icon: Icon,
  colorClassName,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  colorClassName: string;
  children: ReactNode;
}) {
  return (
    <p className="tech-eyebrow flex items-center gap-1.5">
      <Icon className={cn("size-3.5", colorClassName)} aria-hidden />
      {children}
    </p>
  );
}

/** Renders a single First Contribution step from structured step data.
 *  Completion is persisted via a server action against the same generic
 *  progress table other roadmaps use, see lib/first-contribution/progress.ts. */
export function FirstContributionStepView({
  step,
  totalSteps,
  previousHref,
  nextHref,
  continueLabel = "Continue",
  isFinalStep = false,
  isAuthenticated,
  initialCompleted,
}: FirstContributionStepViewProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UnlockedAchievementSummary[]
  >([]);

  const handleToggle = () => {
    setError(null);
    const next = !completed;
    setCompleted(next);

    startTransition(async () => {
      const result = await setFirstContributionStepCompletionAction(step.slug, next);

      if (!result.ok) {
        setCompleted(!next);
        setError(
          result.reason === "unauthenticated"
            ? "Sign in to save your progress."
            : "Couldn't save that. Try again.",
        );
        return;
      }

      setUnlockedAchievements(result.unlockedAchievements);
      router.refresh();
    });
  };

  const Icon = STEP_ICONS[step.icon];

  return (
    <article>
      <FirstContributionCelebration achievements={unlockedAchievements} />

      <span
        className={cn(
          "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[11px] tracking-wide uppercase",
          ACCENT_STYLES[step.accent].badge,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        Step {step.order} of {totalSteps}
      </span>

      <h1 className="mt-3 text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance">
        {step.title}
      </h1>

      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {step.intro}
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <SectionLabel icon={Lightbulb} colorClassName="text-cyan-600 dark:text-cyan-400">
            What you&apos;ll learn
          </SectionLabel>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground">
            <InlineText text={step.whatYoullLearn} />
          </p>
        </section>

        <section>
          <SectionLabel icon={ListChecks} colorClassName="text-indigo-600 dark:text-indigo-400">
            Do this
          </SectionLabel>
          <ul className="mt-2 max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
            {step.doThis.map((item) => (
              <li key={item}>
                <InlineText text={item} />
              </li>
            ))}
          </ul>
          {step.code ? <StepCodeBlock code={step.code} /> : null}
          {step.links && step.links.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {step.links.map((link) => (
                <Button key={link.href} asChild variant="outline" size="sm">
                  <a href={link.href} target="_blank" rel="noreferrer noopener">
                    {link.label}
                    <ExternalLinkIcon className="size-3.5" aria-hidden />
                  </a>
                </Button>
              ))}
            </div>
          ) : null}
        </section>

        {step.tryIt ? (
          <section
            className={cn(
              "max-w-2xl border bg-card p-4 sm:p-5",
              ACCENT_STYLES[step.accent].border,
            )}
          >
            <SectionLabel icon={FlaskConical} colorClassName="text-fuchsia-600 dark:text-fuchsia-400">
              Try it
            </SectionLabel>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              <InlineText text={step.tryIt} />
            </p>
            {step.checklist ? (
              <div className="mt-4">
                <StepChecklist items={step.checklist} />
              </div>
            ) : null}
          </section>
        ) : null}

        {step.checkYourWork ? (
          <section>
            <SectionLabel icon={CheckCircle2} colorClassName="text-emerald-600 dark:text-emerald-400">
              Check your work
            </SectionLabel>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              <InlineText text={step.checkYourWork} />
            </p>
          </section>
        ) : null}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <div className="flex flex-col gap-1.5">
          {isAuthenticated ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggle}
              disabled={isPending}
            >
              {completed ? "Marked complete" : "Mark step complete"}
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/sign-in?next=${encodeURIComponent(`/first-contribution/${step.slug}`)}`}
              >
                Sign in to save progress
              </Link>
            </Button>
          )}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {previousHref ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={previousHref}>Back</Link>
            </Button>
          ) : null}
          {nextHref ? (
            <Button asChild size="sm" className={cn(completed && "border-ink")}>
              <Link
                href={nextHref}
                onClick={
                  isFinalStep ? () => track("first_real_project_clicked") : undefined
                }
              >
                {continueLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
