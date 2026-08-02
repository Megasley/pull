import Link from "next/link";

import { PageHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { ContributionDiscovery } from "@/components/discovery/contribution-discovery";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { loadDiscoveryPageData } from "@/lib/discovery";

export const metadata = {
  title: "Open Source Projects",
  description:
    "Find Bitcoin and Lightning repositories that match your skills - with good first issues, health signals, and personalized recommendations.",
};

export default async function DiscoverPage() {
  const profile = await bootstrapCurrentUserProfile();
  const { repositories, recommendations, context, personalized } =
    await loadDiscoveryPageData(profile?.id);

  const metaParts = personalized
    ? [
        `level ${context.level}`,
        context.completedRoadmapSlugs.length > 0
          ? `completed ${context.completedRoadmapSlugs.join(", ")}`
          : null,
        context.languages.length > 0
          ? `languages ${context.languages.slice(0, 4).join(", ")}`
          : null,
      ].filter(Boolean)
    : [`${repositories.length} curated repos`, "public catalog"];

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="contribute // open source projects"
        title="Open Source Projects"
        description={
          personalized
            ? "Real open source repositories you can contribute to — filtered by language, topic, difficulty, and size, with bookmarks and recommendations tuned to your Pull progress."
            : "Browse curated Bitcoin and Lightning repositories — filter by language, topic, difficulty, and size. Sign in to get recommendations tuned to your progress."
        }
        meta={metaParts.join(" · ")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/issues">ls ./issues</Link>
            </Button>
            {personalized ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/activity">ls ./activity</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/settings/github">./sync --github</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="outline">
                <Link href="/sign-in?next=/discover">./sign-in</Link>
              </Button>
            )}
          </>
        }
      />

      <div className="mt-10">
        <ContributionDiscovery
          repositories={repositories}
          recommendations={recommendations}
        />
      </div>
    </SiteContainer>
  );
}
