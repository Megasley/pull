import { SectionHeader } from "@/components/design-system";
import { Reveal } from "@/components/landing/reveal";
import { RoadmapCard } from "@/components/landing/roadmap-card";
import { availableRoadmaps } from "@/lib/landing-data";

export function AvailableRoadmapsSection() {
  return (
    <section
      id="roadmaps"
      aria-labelledby="available-roadmaps-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8"
    >
      <Reveal>
        <SectionHeader
          eyebrow="catalog // available"
          title="Start with proven paths"
          titleId="available-roadmaps-heading"
          description="Two complete roadmaps are live today. Each includes lessons, projects, and contribution milestones."
          className="mb-10"
        />
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2">
        {availableRoadmaps.map((roadmap, index) => (
          <Reveal key={roadmap.slug} delayMs={index * 90} className="h-full">
            <RoadmapCard roadmap={roadmap} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
