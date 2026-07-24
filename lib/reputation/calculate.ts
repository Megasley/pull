import type {
  ReputationFactor,
  ReputationFactorId,
  ReputationInputs,
  ReputationMilestone,
  ReputationMonthPoint,
  ReputationResult,
  ReputationStrength,
} from "@/types/reputation";

import {
  REPUTATION_TARGETS,
  REPUTATION_VERSION,
  REPUTATION_WEIGHTS,
} from "./weights";

const FACTOR_COPY: Record<
  ReputationFactorId,
  { label: string; description: string }
> = {
  merged_pull_requests: {
    label: "Merged pull requests",
    description: "PRs accepted into other projects.",
  },
  maintainer_reviews: {
    label: "Maintainer reviews",
    description: "Review and discussion engagement on your PRs.",
  },
  contribution_frequency: {
    label: "Contribution frequency",
    description: "Active months across the last year.",
  },
  repository_diversity: {
    label: "Repository diversity",
    description: "Distinct repositories you've merged into.",
  },
  documentation_contributions: {
    label: "Documentation contributions",
    description: "Docs-focused pull requests that landed.",
  },
  issue_discussions: {
    label: "Issue discussions",
    description: "Issues you've opened to move projects forward.",
  },
  code_reviews: {
    label: "Code reviews",
    description: "Reviews you've given to help other builders.",
  },
};

export function saturate(raw: number, target: number): number {
  if (raw <= 0 || target <= 0) return 0;
  return 1 - Math.exp(-1.35 * (raw / target));
}

export function strengthFromNormalized(
  normalized: number,
): ReputationStrength {
  if (normalized >= 0.85) return "exceptional";
  if (normalized >= 0.55) return "strong";
  if (normalized >= 0.25) return "building";
  return "emerging";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSummary(score: number, factors: ReputationFactor[]): string {
  const top = [...factors].sort(
    (a, b) => b.strengthPercent - a.strengthPercent,
  )[0];

  if (score === 0) {
    return "Open Source Reputation grows from merged PRs, reviews, steady contribution months, repo diversity, docs work, issues, and code reviews.";
  }
  if (score < 25) {
    return `Early OSS signal. Land merged PRs and stay active month to month.${top ? ` ${top.label} is leading.` : ""}`;
  }
  if (score < 50) {
    return `Solid open source footprint. Diversifying repos and reviewing others will lift this.${top ? ` Strongest area: ${top.label.toLowerCase()}.` : ""}`;
  }
  if (score < 75) {
    return `Meaningful open source impact. Keep merging and mentoring through reviews.${top ? ` ${top.label} stands out.` : ""}`;
  }
  return `High open source reputation driven by sustained, verified contribution.${top ? ` ${top.label} is a signature strength.` : ""}`;
}

export function calculateReputation(
  inputs: ReputationInputs,
  extras: {
    monthly: ReputationMonthPoint[];
    milestones: ReputationMilestone[];
  },
): ReputationResult {
  const rawByFactor: Record<ReputationFactorId, number> = {
    merged_pull_requests: inputs.mergedPullRequests,
    maintainer_reviews: inputs.maintainerReviewComments,
    contribution_frequency: inputs.activeMonths,
    repository_diversity: inputs.uniqueRepos,
    documentation_contributions: inputs.documentationContributions,
    issue_discussions: inputs.issueDiscussions,
    code_reviews: inputs.codeReviews,
  };

  const factors: ReputationFactor[] = (
    Object.keys(REPUTATION_WEIGHTS) as ReputationFactorId[]
  ).map((id) => {
    const raw = rawByFactor[id];
    const normalized = saturate(raw, REPUTATION_TARGETS[id]);
    const copy = FACTOR_COPY[id];
    return {
      id,
      label: copy.label,
      description: copy.description,
      strengthPercent: clampScore(normalized * 100),
      strength: strengthFromNormalized(normalized),
      raw,
    };
  });

  let weighted = 0;
  for (const factor of factors) {
    weighted += REPUTATION_WEIGHTS[factor.id] * (factor.strengthPercent / 100);
  }

  const score = clampScore(weighted);

  return {
    score,
    version: REPUTATION_VERSION,
    summary: buildSummary(score, factors),
    factors,
    inputs,
    monthly: extras.monthly,
    milestones: extras.milestones,
  };
}
