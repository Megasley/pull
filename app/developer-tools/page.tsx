import { Suspense } from "react";

import { PageHeader } from "@/components/design-system";
import { DeveloperToolFeaturedPartners } from "@/components/developer-tools/developer-tool-featured-partners";
import { DeveloperToolsHeroStats } from "@/components/developer-tools/developer-tools-hero-stats";
import { DeveloperToolsPageClient } from "@/components/developer-tools/developer-tools-page";
import { DeveloperToolsWhySection } from "@/components/developer-tools/developer-tools-why-section";
import { SiteContainer } from "@/components/layout/site-container";
import {
  getDeveloperToolsPageStats,
  listDeveloperTools,
  listFeaturedPartners,
  listPublishedDeveloperToolCategories,
  type DeveloperToolFilter,
} from "@/lib/developer-tools";

export const metadata = {
  title: "Developer Tools",
  description:
    "Discover the tools helping developers build on Bitcoin, Lightning, Nostr, and open source technologies.",
};

type DeveloperToolsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function DeveloperToolsPage({
  searchParams,
}: DeveloperToolsPageProps) {
  const params = await searchParams;
  const tools = listDeveloperTools();
  const categories = listPublishedDeveloperToolCategories();
  const partners = listFeaturedPartners();
  const stats = getDeveloperToolsPageStats();
  const query = params.q?.trim() ?? "";
  const category: DeveloperToolFilter =
    params.category === "All" ||
    (params.category !== undefined &&
      categories.includes(
        params.category as (typeof categories)[number],
      ))
      ? (params.category as DeveloperToolFilter)
      : "All";

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="tools // discover"
        title="Developer Tools"
        description="Discover the tools helping developers build on Bitcoin, Lightning, Nostr, and open source technologies."
      />
      <DeveloperToolsHeroStats {...stats} />

      <div className="mt-10 space-y-12">
        <DeveloperToolFeaturedPartners partners={partners} />
        <DeveloperToolsWhySection />

        <section aria-labelledby="tools-directory-heading" className="space-y-6">
          <div>
            <p className="tech-eyebrow">directory // explore</p>
            <h2
              id="tools-directory-heading"
              className="mt-2 text-xl font-bold tracking-[-0.03em] sm:text-2xl"
            >
              Explore tools
            </h2>
          </div>
          <Suspense fallback={null}>
            <DeveloperToolsPageClient
              tools={tools}
              categories={categories}
              initialQuery={query}
              initialCategory={category}
            />
          </Suspense>
        </section>
      </div>
    </SiteContainer>
  );
}
