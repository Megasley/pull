import type {
  ReputationFactor,
  ReputationFactorId,
  ReputationResult,
} from "@/types/reputation";

function topFactor(factors: ReputationFactor[]) {
  return [...factors].sort((a, b) => b.strengthPercent - a.strengthPercent)[0] ?? null;
}

const WHAT_IT_MEASURES =
  "Tracks open source impact on GitHub: merged PRs, reviews, repo diversity, and active months.";

const PUBLIC_FACTOR_DESCRIPTIONS: Partial<
  Record<ReputationFactorId, string>
> = {
  maintainer_reviews:
    "Review and discussion engagement on merged pull requests.",
  repository_diversity: "Distinct repositories merged into.",
  issue_discussions: "Issues opened to move projects forward.",
  code_reviews: "Reviews given to help other builders.",
};

export function withPublicReputationCopy(
  reputation: ReputationResult,
): ReputationResult {
  return {
    ...reputation,
    factors: reputation.factors.map((factor) => ({
      ...factor,
      description:
        PUBLIC_FACTOR_DESCRIPTIONS[factor.id] ?? factor.description,
    })),
  };
}

export function buildPublicReputationSummary(reputation: ReputationResult): string {
  const top = topFactor(reputation.factors);

  if (reputation.score === 0) {
    return `${WHAT_IT_MEASURES} No synced GitHub activity yet.`;
  }

  if (reputation.score < 25) {
    return top
      ? `${WHAT_IT_MEASURES} Early stage, with ${top.label.toLowerCase()} leading.`
      : `${WHAT_IT_MEASURES} Early stage.`;
  }

  if (reputation.score < 50) {
    return top
      ? `${WHAT_IT_MEASURES} Growing footprint, strongest in ${top.label.toLowerCase()}.`
      : `${WHAT_IT_MEASURES} Growing footprint.`;
  }

  if (reputation.score < 75) {
    return top
      ? `${WHAT_IT_MEASURES} Meaningful impact, with standout ${top.label.toLowerCase()}.`
      : `${WHAT_IT_MEASURES} Meaningful impact.`;
  }

  return top
    ? `${WHAT_IT_MEASURES} High reputation, led by ${top.label.toLowerCase()}.`
    : `${WHAT_IT_MEASURES} High reputation.`;
}
