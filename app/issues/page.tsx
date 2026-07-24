import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { IssueRecommendations } from "@/components/issues/issue-recommendations";
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

  if (!profile) {
    redirect("/sign-in?next=/issues");
  }

  const { context } = await loadIssueRecommendationsPageData(profile.id);

  const metaParts = [
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
  ].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="contribute // issues"
        title="Smart issue recommendations"
        description="Issues matched to your completed roadmaps, projects, languages, GitHub activity, and builder level - with a clear reason for every suggestion."
        meta={metaParts.join(" · ")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/discover">ls ./discover</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/github">./sync --github</Link>
            </Button>
          </>
        }
      />

      <div className="mt-10">
        <IssueRecommendations context={context} />
      </div>
    </div>
  );
}
