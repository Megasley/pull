import Link from "next/link";

import { BuilderCard } from "@/components/builders/builder-card";
import { Reveal, RevealStagger } from "@/components/landing/reveal";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { listFeaturedBuilders } from "@/lib/builders/directory";
import { isDatabaseConfigured } from "@/lib/db/env";

export async function DiscoverBuildersSection() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  let builders: Awaited<ReturnType<typeof listFeaturedBuilders>> = [];
  try {
    builders = await listFeaturedBuilders(6);
  } catch {
    return null;
  }

  if (builders.length === 0) {
    return null;
  }

  return (
    <section
      id="builders"
      aria-labelledby="discover-builders-heading"
      className="border-b border-border"
    >
      <SiteContainer className="py-16 sm:py-20">
        <Reveal variant="clip">
          <p className="tech-eyebrow">community // builders</p>
        </Reveal>
        <Reveal variant="up" delayMs={80}>
          <h2
            id="discover-builders-heading"
            className="mt-3 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em]"
          >
            Discover Builders
          </h2>
        </Reveal>
        <Reveal variant="fade" delayMs={140}>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            Meet builders learning, shipping projects, and contributing upstream — with
            reputation and activity you can verify.
          </p>
        </Reveal>

        <RevealStagger
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variant="up"
          stepMs={90}
        >
          {builders.map((builder) => (
            <BuilderCard key={builder.id} builder={builder} compact />
          ))}
        </RevealStagger>

        <Reveal variant="fade" delayMs={200}>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link href="/builders">Explore All Builders</Link>
            </Button>
          </div>
        </Reveal>
      </SiteContainer>
    </section>
  );
}
