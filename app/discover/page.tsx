import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { ContributionDiscovery } from "@/components/discovery/contribution-discovery";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { loadDiscoveryPageData } from "@/lib/discovery";

export const metadata = {
  title: "Discover",
  description:
    "Find Bitcoin and Lightning repositories that match your skills - with good first issues, health signals, and personalized recommendations.",
};

export default async function DiscoverPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/discover");
  }

  const { repositories, recommendations, context } = await loadDiscoveryPageData(
    profile.id,
  );

  const metaParts = [
    `level ${context.level}`,
    context.completedRoadmapSlugs.length > 0
      ? `completed ${context.completedRoadmapSlugs.join(", ")}`
      : null,
    context.languages.length > 0
      ? `languages ${context.languages.slice(0, 4).join(", ")}`
      : null,
  ].filter(Boolean);

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="contribute // discover"
        title="Contribution discovery"
        description="Find the right repositories to contribute to - filtered by language, topic, difficulty, and size, with bookmarks and recommendations tuned to your Pull progress."
        meta={metaParts.join(" · ")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/issues">ls ./issues</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/activity">ls ./activity</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/github">./sync --github</Link>
            </Button>
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
