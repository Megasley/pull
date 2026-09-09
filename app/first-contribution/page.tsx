import Link from "next/link";

import { PageHeader } from "@/components/design-system";
import { JourneyOverview } from "@/components/first-contribution/journey-overview";
import { ExternalLinkIcon } from "@/components/icons/outline-icons";
import { SiteContainer } from "@/components/layout/site-container";
import { RoadmapProgressBar } from "@/components/roadmap";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getFirstContributionFunnel } from "@/lib/first-contribution/funnel";
import { getFirstContributionProgress } from "@/lib/first-contribution/progress";
import { firstContributionSteps, getNextIncompleteStep } from "@/lib/first-contribution/steps";

const EMPTY_PROGRESS = {
  completedSlugs: [] as string[],
  startedAt: null,
  completedAt: null,
  isComplete: false,
};

export const metadata = {
  title: "First Contribution",
  description:
    "Never contributed to open source before? Pull walks you through the process, step by step, to your first merged pull request.",
};

export default async function FirstContributionPage() {
  const user = await getCurrentUser();
  const [progress, funnel] = await Promise.all([
    user ? getFirstContributionProgress(user.id) : Promise.resolve(EMPTY_PROGRESS),
    getFirstContributionFunnel(),
  ]);
  const completedCount =
    funnel.stages.find((stage) => stage.type === "first_contribution_completed")?.users ?? 0;

  const totalSteps = firstContributionSteps.length;
  const hasStarted = progress.completedSlugs.length > 0;
  const nextStep = getNextIncompleteStep(progress.completedSlugs);
  const ctaHref = progress.isComplete
    ? `/first-contribution/${firstContributionSteps[0].slug}`
    : `/first-contribution/${nextStep.slug}`;
  const ctaLabel = progress.isComplete
    ? "Review the journey"
    : hasStarted
      ? "Continue the journey"
      : "Start the journey";

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="contribute // first contribution"
        title="Make Your First Open Source Contribution"
        description="Never contributed to open source before? We'll walk you through the process, step by step."
        meta={`${totalSteps} steps · ~30 minutes · GitHub required · Beginner friendly`}
        actions={
          <Button size="lg" asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        }
      />

      {/* Only shown once real, since "0 developers have completed this" on a
          fresh feature reads worse than nothing at all — see
          lib/first-contribution/funnel.ts for where this count comes from. */}
      {completedCount > 0 ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {completedCount} {completedCount === 1 ? "developer has" : "developers have"} completed
          this journey
        </p>
      ) : null}

      {hasStarted ? (
        <RoadmapProgressBar
          className="mt-8 max-w-md"
          label="progress // first contribution"
          ariaLabel="First Contribution journey progress"
          progress={{
            completed: progress.completedSlugs.length,
            total: totalSteps,
            percentage: Math.round((progress.completedSlugs.length / totalSteps) * 100),
          }}
        />
      ) : null}

      <JourneyOverview
        steps={firstContributionSteps}
        completedSlugs={progress.completedSlugs}
        nextSlug={hasStarted && !progress.isComplete ? nextStep.slug : undefined}
      />

      {/* Secondary, optional — the journey above is self-contained and never
          requires this link. See docs/Open_Source_Guide.md Phase 15. */}
      <div className="max-w-2xl border-t border-border pt-6">
        <p className="tech-eyebrow">Go deeper</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Want more background on how open source works? The{" "}
          <a
            href="https://opensource.guide/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground underline underline-offset-2 hover:text-muted-foreground"
          >
            Open Source Guide
            <ExternalLinkIcon className="ml-1 inline size-3" aria-hidden />
          </a>{" "}
          is optional extra reading (external site). You don&apos;t need it to finish this journey.
        </p>
      </div>
    </SiteContainer>
  );
}
