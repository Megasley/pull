import type {
  BuilderScoreFactor,
  BuilderScoreFactorId,
  BuilderScoreInputs,
  BuilderScoreResult,
  BuilderScoreStrength,
} from "@/types/score";

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
  if (raw <= 0 || target <= 0) return 0;
  const ratio = raw / target;
  return 1 - Math.exp(-1.4 * ratio);
}

export function strengthFromNormalized(normalized: number): BuilderScoreStrength {
  if (normalized >= 0.85) return "exceptional";
  if (normalized >= 0.55) return "strong";
  if (normalized >= 0.25) return "building";
  return "emerging";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSummary(score: number, factors: BuilderScoreFactor[]): string {
  const top = [...factors].sort((a, b) => b.strengthPercent - a.strengthPercent)[0];

  if (score === 0) {
    return "Your Builder Score grows as you complete projects, earn approvals, finish roadmaps, contribute to open source, review community work, and keep a steady cadence.";
  }

  if (score < 25) {
    return `You're getting started. Focus on finishing projects and shipping reviewed work to raise your score.${top ? ` ${top.label} is already moving.` : ""}`;
  }

  if (score < 50) {
    return `Solid foundation. Approvals and consistent weekly building will lift this further.${top ? ` Strongest signal today: ${top.label.toLowerCase()}.` : ""}`;
  }

  if (score < 75) {
    return `You're building real credibility through verified work.${top ? ` ${top.label} stands out.` : ""} Keep shipping and reviewing to push higher.`;
  }

  return `High Builder Score driven by verified building activity.${top ? ` ${top.label} is a standout strength.` : ""} Scores stay dynamic as you keep contributing.`;
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
