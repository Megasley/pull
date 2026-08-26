import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { PARTNER_TYPE_LABELS, listPartners } from "@/lib/ecosystem/partners";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Partners · Ecosystem",
  description:
    "Organizations and communities working with Pull to place developers into open source contribution programs.",
};

export default function EcosystemPartnersPage() {
  const partners = listPartners();

  return (
    <SiteContainer className="pt-12 pb-20">
      <PageHeader
        eyebrow="ecosystem // partners"
        title="Pull Partners"
        description="Organizations and communities that work with Pull to place developers into structured open source contribution programs."
        meta={`${partners.length} partner${partners.length !== 1 ? "s" : ""}`}
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <li key={partner.slug}>
            <Link
              href={`/ecosystem/partners/${partner.slug}`}
              className="group flex h-full flex-col border border-border bg-background p-5 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex size-12 shrink-0 items-center justify-center border border-ink bg-signal font-mono text-xs font-bold text-ink"
                  aria-hidden
                >
                  {partner.logoSrc ? (
                    <img
                      src={partner.logoSrc}
                      alt={partner.name}
                      className={cn(
                        "h-4 w-auto",
                        partner.logoLight ? "invert dark:invert-0" : "dark:invert",
                      )}
                    />
                  ) : (
                    partner.logoInitials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold tracking-tight">{partner.name}</h2>
                    <span className="shrink-0 border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {PARTNER_TYPE_LABELS[partner.partnerType]}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 font-mono text-xs leading-relaxed text-muted-foreground">
                    {partner.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-5 font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                View partner →
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </SiteContainer>
  );
}
