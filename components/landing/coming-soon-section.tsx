import { SectionHeader } from "@/components/design-system";
import { Reveal } from "@/components/landing/reveal";
import { SiteContainer } from "@/components/layout/site-container";
import { RoadmapCard } from "@/components/landing/roadmap-card";
import { comingSoonRoadmaps } from "@/lib/landing-data";

export function ComingSoonSection() {
  return (
    <SiteContainer as="section" aria-labelledby="coming-soon-heading" className="py-16">
      <Reveal>
        <SectionHeader
          eyebrow="catalog // coming-soon"
          title="The ecosystem is expanding"
          titleId="coming-soon-heading"
          description="More specialized tracks are on the way"
          className="mb-10"
        />
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {comingSoonRoadmaps.map((roadmap, index) => (
          <Reveal key={roadmap.slug} delayMs={index * 70} className="h-full">
            <RoadmapCard roadmap={roadmap} />
          </Reveal>
        ))}
      </div>
    </SiteContainer>
  );
}
