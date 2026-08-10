import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeveloperToolDetail } from "@/components/developer-tools/developer-tool-detail";
import { SiteContainer } from "@/components/layout/site-container";
import {
  getDeveloperToolBySlug,
  listDeveloperToolSlugs,
} from "@/lib/developer-tools";
import { siteConfig } from "@/lib/site-config";

type DeveloperToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listDeveloperToolSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DeveloperToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getDeveloperToolBySlug(slug);
  if (!tool) return { title: "Developer Tool" };

  return {
    title: `${tool.name} · Developer Tools`,
    description: tool.description,
    alternates: { canonical: `/developer-tools/${tool.slug}` },
    openGraph: {
      title: `${tool.name} on ${siteConfig.name}`,
      description: tool.description,
      url: `/developer-tools/${tool.slug}`,
      type: "website",
    },
  };
}

export default async function DeveloperToolPage({
  params,
}: DeveloperToolPageProps) {
  const { slug } = await params;
  const tool = getDeveloperToolBySlug(slug);
  if (!tool) notFound();

  return (
    <SiteContainer className="pt-10 pb-20 sm:pt-12">
      <DeveloperToolDetail tool={tool} />
    </SiteContainer>
  );
}
