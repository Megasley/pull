import { DeveloperToolSponsoredBadge } from "@/components/developer-tools/developer-tool-badge";
import { Button } from "@/components/ui/button";
import type { DeveloperTool } from "@/lib/developer-tools/types";

type DeveloperToolFeaturedPartnersProps = {
  partners: DeveloperTool[];
};

export function DeveloperToolFeaturedPartners({
  partners,
}: DeveloperToolFeaturedPartnersProps) {
  if (partners.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-partners-heading"
      className="border border-border bg-background"
    >
      <div className="border-b border-border px-4 py-5 sm:px-6">
        <p className="tech-eyebrow">partners // featured</p>
        <h2
          id="featured-partners-heading"
          className="mt-2 text-xl font-bold tracking-[-0.03em] sm:text-2xl"
        >
          Featured Partners
        </h2>
        <p className="mt-2 max-w-2xl font-mono text-sm text-muted-foreground">
          Tools helping developers build the future.
        </p>
      </div>

      <ul className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
        {partners.map((partner) => (
          <li key={partner.id} className="min-w-0">
            <article className="flex h-full flex-col p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div
                  className="flex size-11 shrink-0 items-center justify-center border border-ink bg-signal font-mono text-xs font-bold text-ink"
                  aria-hidden
                >
                  {partner.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight">
                      {partner.name}
                    </h3>
                    {partner.sponsored ? <DeveloperToolSponsoredBadge /> : null}
                  </div>
                </div>
              </div>
              <p className="mt-3 flex-1 font-mono text-xs leading-relaxed text-muted-foreground">
                {partner.description}
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={partner.website} target="_blank" rel="noreferrer">
                    Visit Website
                  </a>
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
