import { Suspense } from "react";

import { AudienceSection } from "@/components/landing/audience-section";
import { BuilderLoopSection } from "@/components/landing/builder-loop-section";
import { DiscoverBuildersSection } from "@/components/landing/discover-builders-section";
import { FeaturedRoadmapsSection } from "@/components/landing/featured-roadmaps-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { ProofSection } from "@/components/landing/proof-section";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function Home() {
  return (
    <div>
      <ScrollProgress />
      <HeroSection />
      <BuilderLoopSection />
      <FeaturedRoadmapsSection />
      <Suspense fallback={null}>
        <DiscoverBuildersSection />
      </Suspense>
      <AudienceSection />
      <ProofSection />
      <FinalCtaSection />
    </div>
  );
}
