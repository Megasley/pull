import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { ReputationPanel } from "@/components/reputation/reputation-panel";
import { Button } from "@/components/ui/button";
import type { ReputationResult } from "@/types/reputation";

type ReputationSectionProps = {
  reputation: ReputationResult;
};

export function ReputationSection({ reputation }: ReputationSectionProps) {
  return (
    <DashboardSection
      id="open-source-reputation"
      title="Open Source Reputation"
      description="Meaningful OSS impact from merges, reviews, cadence, and diversity."
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/reputation">Full breakdown</Link>
        </Button>
      }
    >
      <ReputationPanel reputation={reputation} compact />
    </DashboardSection>
  );
}
