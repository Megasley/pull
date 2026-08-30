import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { getPartnerBySlug, listPartnerSlugs } from "@/lib/ecosystem/partners";
import { siteConfig } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

const STATIC_PARTNER_PAGES = new Set(["trezor-academy", "the-buidl"]);

export function generateStaticParams() {
  return listPartnerSlugs()
    .filter((slug) => !STATIC_PARTNER_PAGES.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const partner = getPartnerBySlug(slug);
  if (!partner || partner.hidden) return { title: "Partner" };
  return {
    title: `${partner.name} · Partners`,
    description: partner.tagline,
    alternates: { canonical: `/ecosystem/partners/${slug}` },
  };
}

export default async function PartnerPage({ params }: Props) {
  const { slug } = await params;
  const partner = getPartnerBySlug(slug);
  if (!partner || partner.hidden) notFound();

  return (
    <SiteContainer className="pt-12 pb-20">
      <PageHeader
        eyebrow="ecosystem // partners"
        title={partner.name}
        description={partner.tagline}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/ecosystem/partners">← Partners</Link>
            </Button>
            <Button asChild size="sm">
              <a href={partner.website} target="_blank" rel="noreferrer">
                Visit website ↗
              </a>
            </Button>
          </div>
        }
      />

      <div className="mt-10 max-w-2xl">
        <p className="font-mono text-sm leading-relaxed text-muted-foreground">
          {partner.description}
        </p>
      </div>

      <div className="mt-12 border border-border p-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Pull Partner Program
        </h2>
        <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground">
          {partner.name} graduates get a shared invite link to join Pull and continue their open
          source contribution journey — no separate signup process required.
        </p>
        <div className="mt-6">
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="inline-block border border-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Inquire about a partnership ↗
          </a>
        </div>
      </div>
    </SiteContainer>
  );
}
