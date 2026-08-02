import { Suspense } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/design-system";
import { IssueRecommendations } from "@/components/issues/issue-recommendations";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { loadIssueRecommendationsPageData } from "@/lib/issues";

export const metadata = {
  title: "Issue recommendations",
  description:
    "Smart GitHub issue recommendations based on your roadmaps, projects, languages, and Pull level.",
};

export default async function IssuesPage() {
  const profile = await bootstrapCurrentUserProfile();
  const { context, personalized } = await loadIssueRecommendationsPageData(
    profile?.id,
  );

  const metaParts = personalized
    ? [
        `level ${context.level}`,
        context.completedRoadmapSlugs.length > 0
          ? `${context.completedRoadmapSlugs.join(", ")} roadmap`
          : null,
        context.completedProjectSlugs.length > 0
          ? `${context.completedProjectSlugs.length} projects`
          : null,
        context.languages.length > 0
          ? context.languages.slice(0, 4).join(", ")
          : null,
        context.githubActivityCount > 0
          ? `${context.githubActivityCount} synced events`
          : null,
      ].filter(Boolean)
    : ["curated issues", "public catalog"];

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="contribute // issues"
        title="Smart issue recommendations"
        description={
          personalized
            ? "Issues matched to your completed roadmaps, projects, languages, GitHub activity, and builder level - with a clear reason for every suggestion."
            : "Browse curated good-first and help-wanted issues across Bitcoin and Lightning projects. Sign in to match issues to your roadmaps and languages."
        }
        meta={metaParts.join(" · ")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/discover">ls ./open-source</Link>
            </Button>
            {personalized ? (
              <Button asChild variant="outline">
                <Link href="/settings/github">./sync --github</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/sign-in?next=/issues">./sign-in</Link>
              </Button>
            )}
          </>
        }
      />

      <div className="mt-10">
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              Loading recommendations…
            </p>
          }
        >
          <IssueRecommendations context={context} />
        </Suspense>
      </div>
    </SiteContainer>
  );
}
