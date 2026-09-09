import { notFound } from "next/navigation";

import { FirstContributionStepView } from "@/components/first-contribution/first-contribution-step";
import { StepSidebar } from "@/components/first-contribution/step-sidebar";
import { SiteContainer } from "@/components/layout/site-container";
import { getCurrentUser } from "@/lib/auth/session";
import { getFirstContributionProgress } from "@/lib/first-contribution/progress";
import {
  firstContributionSteps,
  getAdjacentSteps,
  getFirstContributionStep,
} from "@/lib/first-contribution/steps";

type FirstContributionStepPageProps = {
  params: Promise<{ step: string }>;
};

export async function generateStaticParams() {
  return firstContributionSteps.map((step) => ({ step: step.slug }));
}

export async function generateMetadata({ params }: FirstContributionStepPageProps) {
  const { step: slug } = await params;
  const step = getFirstContributionStep(slug);

  if (!step) {
    return { title: "Step not found" };
  }

  return {
    title: `${step.title} · First Contribution`,
    description: step.intro,
  };
}

export default async function FirstContributionStepPage({
  params,
}: FirstContributionStepPageProps) {
  const { step: slug } = await params;
  const step = getFirstContributionStep(slug);

  if (!step) {
    notFound();
  }

  const user = await getCurrentUser();
  const progress = user
    ? await getFirstContributionProgress(user.id)
    : { completedSlugs: [] as string[], startedAt: null, completedAt: null, isComplete: false };

  const { previous, next } = getAdjacentSteps(slug);
  const isLastStep = !next;

  return (
    <SiteContainer className="max-w-5xl pt-12 pb-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[248px_minmax(0,1fr)]">
        <StepSidebar
          steps={firstContributionSteps}
          completedSlugs={progress.completedSlugs}
          currentSlug={step.slug}
        />
        <FirstContributionStepView
          step={step}
          totalSteps={firstContributionSteps.length}
          previousHref={previous ? `/first-contribution/${previous.slug}` : undefined}
          nextHref={isLastStep ? "/discover" : `/first-contribution/${next.slug}`}
          continueLabel={isLastStep ? "Find a real project" : "Continue"}
          isFinalStep={isLastStep}
          isAuthenticated={Boolean(user)}
          initialCompleted={progress.completedSlugs.includes(step.slug)}
        />
      </div>
    </SiteContainer>
  );
}
