import { SectionHeader } from "@/components/design-system";
import { Reveal } from "@/components/landing/reveal";
import { RoadmapCard } from "@/components/landing/roadmap-card";
import { comingSoonRoadmaps } from "@/lib/landing-data";

export function ComingSoonSection() {
  return (
    <section
      aria-labelledby="coming-soon-heading"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <Reveal>
        <SectionHeader
          eyebrow="catalog // coming-soon"
          title="The ecosystem is expanding"
          titleId="coming-soon-heading"
          description="More specialized tracks are on the way - from protocol research to wallet engineering."
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
    </section>
  );
}
