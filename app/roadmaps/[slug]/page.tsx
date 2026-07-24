import Link from "next/link";
import { notFound } from "next/navigation";

import { RoadmapEngine } from "@/components/roadmap";
import { Button } from "@/components/ui/button";
import { availableRoadmaps } from "@/lib/landing-data";
import { getRoadmap, getRoadmapSlugs } from "@/lib/roadmap/load-roadmap";
import { siteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/supabase/env";

type RoadmapPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getRoadmapSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: RoadmapPageProps) {
  const { slug } = await params;
  const roadmap =
    getRoadmap(slug) ?? availableRoadmaps.find((item) => item.slug === slug);

  if (!roadmap) {
    return { title: "Roadmap not found" };
  }

  const base = getSiteUrl() || siteConfig.url;
  const path = `/roadmaps/${slug}`;
  const title = `${roadmap.title} roadmap`;
  const description =
    "description" in roadmap ? roadmap.description : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${base}${path}`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: {
      canonical: `${base}${path}`,
    },
  };
}

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { slug } = await params;
  const landingMeta = availableRoadmaps.find((item) => item.slug === slug);
  const roadmapData = getRoadmap(slug);

  if (!landingMeta || !roadmapData) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl border-b border-border pb-8">
        <p className="tech-eyebrow">roadmap // {roadmapData.id}</p>
        <h1 className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-bold tracking-[-0.04em]">
          {roadmapData.title}
        </h1>
        <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
          {roadmapData.description}
        </p>
        {landingMeta.prerequisite ? (
          <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            gated // {landingMeta.prerequisite}
          </p>
        ) : (
          <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            status // available
          </p>
        )}
      </div>

      <RoadmapEngine data={roadmapData} />

      <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
        <Button asChild>
          <Link href="/roadmaps">./start-building</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/roadmaps">ls ./roadmaps</Link>
        </Button>
      </div>
    </div>
  );
}
