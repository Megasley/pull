import { AvailableRoadmapsSection } from "@/components/landing/available-roadmaps-section";
import { ComingSoonSection } from "@/components/landing/coming-soon-section";
import { PageHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";

export const metadata = {
  title: "Roadmaps",
  description: "Explore Pull learning roadmaps for Bitcoin and open source builders.",
};

export default function RoadmapsPage() {
  return (
    <div>
      <SiteContainer className="pt-12">
        <PageHeader
          eyebrow="catalog // roadmaps"
          title="Roadmaps"
          description="Structured paths from fundamentals to open source contribution. Start with Bitcoin, then unlock Lightning and upcoming tracks. Lessons are public beta — curriculum under technical review."
          meta="status // 2 live · under review · more incoming"
        />
      </SiteContainer>

      <AvailableRoadmapsSection />
      <ComingSoonSection />
    </div>
  );
}
