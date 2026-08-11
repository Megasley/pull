import type {
  BuilderScoreFactor,
  BuilderScoreFactorId,
  BuilderScoreInputs,
  BuilderScoreResult,
  BuilderScoreStrength,
} from "@/types/score";

import {
  buildScoreSummary,
  clampScore,
  saturate as saturateBase,
  strengthFromNormalized as strengthFromNormalizedBase,
} from "@/lib/scoring/normalize";

import {
  BUILDER_SCORE_TARGETS,
  BUILDER_SCORE_VERSION,
  BUILDER_SCORE_WEIGHTS,
} from "./weights";

const FACTOR_COPY: Record<
  BuilderScoreFactorId,
  { label: string; description: string }
> = {
  projects_completed: {
    label: "Projects completed",
    description: "Hands-on project work finished across your roadmaps.",
  },
  projects_approved: {
    label: "Projects approved",
    description: "Submissions that passed Pull review.",
  },
  roadmaps_completed: {
    label: "Roadmaps completed",
    description: "Learning paths finished end to end.",
  },
  open_source_contributions: {
    label: "Open source contributions",
    description: "Verified pull requests and shipped OSS work.",
  },
  community_reviews: {
    label: "Community reviews",
    description: "Feedback and review activity that helps other builders.",
  },
  contribution_consistency: {
    label: "Contribution consistency",
    description: "Steady building rhythm across recent weeks.",
  },
};

/**
 * Soft saturation: reaches ~1.0 near the target, asymptotes below 1.15.
 * Keeps early progress meaningful without hard cliffs.
 */
export function saturate(raw: number, target: number): number {
  return saturateBase(raw, target, 1.4);
}

export function strengthFromNormalized(normalized: number): BuilderScoreStrength {
  return strengthFromNormalizedBase(normalized) as BuilderScoreStrength;
}

function buildSummary(score: number, factors: BuilderScoreFactor[]): string {
  return buildScoreSummary(score, factors, {
    zero: "Your Builder Score grows as you complete projects, earn approvals, finish roadmaps, contribute to open source, review community work, and keep a steady cadence.",
    early: (top) =>
      `You're getting started. Focus on finishing projects and shipping reviewed work to raise your score.${top ? ` ${top} is already moving.` : ""}`,
    solid: (top) =>
      `Solid foundation. Approvals and consistent weekly building will lift this further.${top ? ` Strongest signal today: ${top.toLowerCase()}.` : ""}`,
    meaningful: (top) =>
      `You're building real credibility through verified work.${top ? ` ${top} stands out.` : ""} Keep shipping and reviewing to push higher.`,
    high: (top) =>
      `High Builder Score driven by verified building activity.${top ? ` ${top} is a standout strength.` : ""} Scores stay dynamic as you keep contributing.`,
  });
}

export function calculateBuilderScore(inputs: BuilderScoreInputs): BuilderScoreResult {
  const rawByFactor: Record<BuilderScoreFactorId, number> = {
    projects_completed: inputs.projectsCompleted,
    projects_approved: inputs.projectsApproved,
    roadmaps_completed: inputs.roadmapsCompleted,
    open_source_contributions: inputs.openSourceContributions,
    community_reviews: inputs.communityReviews,
    contribution_consistency: inputs.activeWeeks,
  };

  const factors: BuilderScoreFactor[] = (
    Object.keys(BUILDER_SCORE_WEIGHTS) as BuilderScoreFactorId[]
  ).map((id) => {
    const normalized = saturate(rawByFactor[id], BUILDER_SCORE_TARGETS[id]);
    const copy = FACTOR_COPY[id];

    return {
      id,
      label: copy.label,
      description: copy.description,
      strengthPercent: clampScore(normalized * 100),
      strength: strengthFromNormalized(normalized),
    };
  });

  let weighted = 0;
  for (const factor of factors) {
    const weight = BUILDER_SCORE_WEIGHTS[factor.id];
    const normalized = factor.strengthPercent / 100;
    weighted += weight * normalized;
  }

  const score = clampScore(weighted);

  return {
    score,
    version: BUILDER_SCORE_VERSION,
    summary: buildSummary(score, factors),
    factors,
    inputs,
  };
}
