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
  buildScoreSummary,
  clampScore,
  saturate as saturateBase,
  strengthFromNormalized as strengthFromNormalizedBase,
} from "@/lib/scoring/normalize";

import { REPUTATION_TARGETS, REPUTATION_VERSION, REPUTATION_WEIGHTS } from "./weights";

const REPUTATION_SATURATION_COEFFICIENT = 1.35;

const FACTOR_COPY: Record<ReputationFactorId, { label: string; description: string }> =
  {
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
  return saturateBase(raw, target, REPUTATION_SATURATION_COEFFICIENT);
}

export function strengthFromNormalized(normalized: number): ReputationStrength {
  return strengthFromNormalizedBase(normalized) as ReputationStrength;
}

function buildSummary(score: number, factors: ReputationFactor[]): string {
  return buildScoreSummary(score, factors, {
    zero: "Open Source Reputation grows from merged PRs, reviews, steady contribution months, repo diversity, docs work, issues, and code reviews.",
    early: (top) =>
      `Early OSS signal. Land merged PRs and stay active month to month.${top ? ` ${top} is leading.` : ""}`,
    solid: (top) =>
      `Solid open source footprint. Diversifying repos and reviewing others will lift this.${top ? ` Strongest area: ${top.toLowerCase()}.` : ""}`,
    meaningful: (top) =>
      `Meaningful open source impact. Keep merging and mentoring through reviews.${top ? ` ${top} stands out.` : ""}`,
    high: (top) =>
      `High open source reputation driven by sustained, verified contribution.${top ? ` ${top} is a signature strength.` : ""}`,
  });
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
