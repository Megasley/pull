import type {
  BuilderScoreFactor,
  BuilderScoreFactorId,
  BuilderScoreResult,
} from "@/types/score";

function topFactor(factors: BuilderScoreFactor[]) {
  return [...factors].sort((a, b) => b.strengthPercent - a.strengthPercent)[0] ?? null;
}

const WHAT_IT_MEASURES =
  "Tracks learning and shipping on Pull: roadmaps, projects, approvals, and community reviews.";

/** Short, standalone explainer for a hover tooltip on the score itself —
 *  distinct from buildPublicBuilderScoreSummary, which also reacts to the
 *  current score band. See components/score/builder-score-panel.tsx. */
export const BUILDER_SCORE_EXPLAINER = WHAT_IT_MEASURES;

const PUBLIC_FACTOR_DESCRIPTIONS: Partial<Record<BuilderScoreFactorId, string>> = {
  projects_completed: "Hands-on project work finished across roadmaps.",
};

export function withPublicBuilderScoreCopy(
  score: BuilderScoreResult,
): BuilderScoreResult {
  return {
    ...score,
    factors: score.factors.map((factor) => ({
      ...factor,
      description: PUBLIC_FACTOR_DESCRIPTIONS[factor.id] ?? factor.description,
    })),
  };
}

export function buildPublicBuilderScoreSummary(score: BuilderScoreResult): string {
  const top = topFactor(score.factors);

  if (score.score === 0) {
    return `${WHAT_IT_MEASURES} No verified activity yet.`;
  }

  if (score.score < 25) {
    return top
      ? `${WHAT_IT_MEASURES} Early stage, with ${top.label.toLowerCase()} leading.`
      : `${WHAT_IT_MEASURES} Early stage.`;
  }

  if (score.score < 50) {
    return top
      ? `${WHAT_IT_MEASURES} Building momentum, led by ${top.label.toLowerCase()}.`
      : `${WHAT_IT_MEASURES} Building momentum.`;
  }

  if (score.score < 75) {
    return top
      ? `${WHAT_IT_MEASURES} Established profile, with standout ${top.label.toLowerCase()}.`
      : `${WHAT_IT_MEASURES} Established profile.`;
  }

  return top
    ? `${WHAT_IT_MEASURES} High score, anchored by ${top.label.toLowerCase()}.`
    : `${WHAT_IT_MEASURES} High score.`;
}
