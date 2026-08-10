import Link from "next/link";

import { Reveal, RevealStagger } from "@/components/landing/reveal";
import { SiteContainer } from "@/components/layout/site-container";
import { RoadmapCard } from "@/components/landing/roadmap-card";
import { Button } from "@/components/ui/button";
import { availableRoadmaps } from "@/lib/landing-data";

const featuredRoadmaps = availableRoadmaps.slice(0, 2);

export function FeaturedRoadmapsSection() {
  return (
    <section
      id="featured"
      aria-labelledby="featured-roadmaps-heading"
      className="border-b border-border"
    >
      <SiteContainer className="py-16 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Reveal variant="clip">
              <p className="tech-eyebrow">paths // featured</p>
            </Reveal>
            <Reveal variant="up" delayMs={80}>
              <h2
                id="featured-roadmaps-heading"
                className="mt-3 text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em]"
              >
                Start with a proven path
              </h2>
            </Reveal>
            <Reveal variant="fade" delayMs={140}>
              <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
                Live roadmaps with lessons, projects, and contribution milestones. More
                tracks live on the full catalog.
              </p>
            </Reveal>
          </div>
          <Reveal variant="zoom" delayMs={180}>
            <Button variant="outline" asChild>
              <Link href="/roadmaps">ls ./roadmaps</Link>
            </Button>
          </Reveal>
        </div>

        <RevealStagger
          className="mt-10 grid gap-5 md:grid-cols-2"
          itemClassName="h-full"
          variant="up"
          stepMs={120}
        >
          {featuredRoadmaps.map((roadmap) => (
            <RoadmapCard key={roadmap.slug} roadmap={roadmap} />
          ))}
        </RevealStagger>
      </SiteContainer>
    </section>
  );
}
