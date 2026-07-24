import { AvailableRoadmapsSection } from "@/components/landing/available-roadmaps-section";
import { ComingSoonSection } from "@/components/landing/coming-soon-section";
import { PageHeader } from "@/components/design-system";

export const metadata = {
  title: "Roadmaps",
  description: "Explore Pull learning roadmaps for Bitcoin and open source builders.",
};

export default function RoadmapsPage() {
  return (
    <div>
      <div className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="catalog // roadmaps"
          title="Roadmaps"
          description="Structured paths from fundamentals to open source contribution. Start with Bitcoin, then unlock Lightning and upcoming tracks."
          meta="status // 2 live · more incoming"
        />
      </div>

      <AvailableRoadmapsSection />
      <ComingSoonSection />
    </div>
  );
}
