import Link from "next/link";

import { Reveal } from "@/components/landing/reveal";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-signal relative w-full overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="tech-scanline absolute inset-x-0 top-0 h-px bg-ink/40" />
        <div className="tech-grid absolute inset-0 opacity-[0.1]" />
      </div>

      <SiteContainer className="relative flex flex-col gap-8 py-20 sm:py-24">
        <Reveal variant="clip">
          <p className="font-mono text-[11px] tracking-[0.14em] text-ink/65 uppercase">
            exec // next
          </p>
        </Reveal>
        <Reveal variant="up" delayMs={90}>
          <h2
            id="final-cta-heading"
            className="mt-3 max-w-3xl text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] font-bold tracking-[-0.04em] text-ink"
          >
            Ready to become a builder?
          </h2>
        </Reveal>
        <Reveal variant="fade" delayMs={150}>
          <p className="max-w-xl font-mono text-base leading-snug tracking-[-0.02em] text-ink/80 sm:text-lg">
            Pick a roadmap, build real software, contribute upstream, and publish a
            portfolio others can verify.
          </p>
        </Reveal>
        <Reveal variant="zoom" delayMs={210}>
          <Button
            size="lg"
            asChild
            className="h-12 w-full border-ink bg-ink px-6 text-[var(--background)] hover:bg-ink/90 sm:w-auto"
          >
            <Link href="/roadmaps">./start-building</Link>
          </Button>
        </Reveal>
      </SiteContainer>
    </section>
  );
}
