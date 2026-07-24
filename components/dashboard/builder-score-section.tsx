import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { BuilderScorePanel } from "@/components/score/builder-score-panel";
import type { BuilderScoreResult } from "@/types/score";

type BuilderScoreSectionProps = {
  score: BuilderScoreResult;
};

export function BuilderScoreSection({ score }: BuilderScoreSectionProps) {
  return (
    <DashboardSection
      id="builder-score"
      title="Builder Score"
      description="Measured by what you build - not quiz scores."
    >
      <BuilderScorePanel score={score} />
    </DashboardSection>
  );
}
