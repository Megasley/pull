import { Suspense } from "react";

import { PageHeader } from "@/components/design-system";
import { DeveloperToolFeaturedPartners } from "@/components/developer-tools/developer-tool-featured-partners";
import { DeveloperToolsHeroStats } from "@/components/developer-tools/developer-tools-hero-stats";
import { DeveloperToolsPageClient } from "@/components/developer-tools/developer-tools-page";
import { DeveloperToolsWhySection } from "@/components/developer-tools/developer-tools-why-section";
import { SuggestDeveloperToolForm } from "@/components/developer-tools/suggest-developer-tool-form";
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
      categories.includes(params.category as (typeof categories)[number]))
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="tech-eyebrow">directory // explore</p>
              <h2
                id="tools-directory-heading"
                className="mt-2 text-xl font-bold tracking-[-0.03em] sm:text-2xl"
              >
                Explore tools
              </h2>
            </div>
            <a
              href="#suggest-a-tool"
              className="font-mono text-xs tracking-wide text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Suggest a tool →
            </a>
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

        <section
          id="suggest-a-tool"
          aria-labelledby="suggest-tool-heading"
          className="scroll-mt-24 space-y-6 border-t border-border pt-12"
        >
          <div className="max-w-2xl">
            <p className="tech-eyebrow">contribute // suggest</p>
            <h2
              id="suggest-tool-heading"
              className="mt-2 text-xl font-bold tracking-[-0.03em] sm:text-2xl"
            >
              Suggest a tool
            </h2>
            <p className="mt-2 font-mono text-sm leading-relaxed text-muted-foreground">
              Know an API, SDK, or infrastructure project builders should discover? Send
              it our way — we review every suggestion before it goes live.
            </p>
          </div>
          <div className="max-w-2xl">
            <SuggestDeveloperToolForm />
          </div>
        </section>
      </div>
    </SiteContainer>
  );
}
