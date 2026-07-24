/**
 * Smoke checks for Open Source Reputation scoring.
 * Run: npx tsx scripts/verify-reputation.ts
 */
import {
  calculateReputation,
  saturate,
  strengthFromNormalized,
} from "../lib/reputation/calculate";
import {
  buildMonthlyProgress,
  buildReputationMilestones,
  countActiveMonths,
} from "../lib/reputation/milestones";
import {
  REPUTATION_MONTHS,
  REPUTATION_TARGETS,
  REPUTATION_VERSION,
  REPUTATION_WEIGHTS,
} from "../lib/reputation/weights";
import type { ReputationInputs } from "../types/reputation";
import type { PullRequestPortfolioItem } from "../types/portfolio";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const emptyInputs: ReputationInputs = {
  mergedPullRequests: 0,
  maintainerReviewComments: 0,
  activeMonths: 0,
  uniqueRepos: 0,
  documentationContributions: 0,
  issueDiscussions: 0,
  codeReviews: 0,
};

const weightSum = Object.values(REPUTATION_WEIGHTS).reduce((a, b) => a + b, 0);
assert(weightSum === 100, `weights must sum to 100 (got ${weightSum})`);
assert(REPUTATION_VERSION === "v1", "version pinned for era");
assert(REPUTATION_MONTHS === 12, "twelve-month window");

assert(saturate(0, 8) === 0, "saturate zero");
assert(saturate(8, 8) > 0.7 && saturate(8, 8) < 0.8, "saturate at target");
assert(saturate(100, 8) > 0.99, "saturate high");
assert(strengthFromNormalized(0.1) === "emerging", "emerging");
assert(strengthFromNormalized(0.4) === "building", "building");
assert(strengthFromNormalized(0.7) === "strong", "strong");
assert(strengthFromNormalized(0.9) === "exceptional", "exceptional");

const empty = calculateReputation(emptyInputs, {
  monthly: [],
  milestones: [],
});
assert(empty.score === 0, "empty score is 0");
assert(empty.factors.length === 7, "seven factors");
assert(
  empty.factors.every((f) => f.strengthPercent === 0),
  "empty factors zero",
);

const midInputs: ReputationInputs = {
  mergedPullRequests: 4,
  maintainerReviewComments: 10,
  activeMonths: 4,
  uniqueRepos: 3,
  documentationContributions: 1,
  issueDiscussions: 4,
  codeReviews: 5,
};

const mid = calculateReputation(midInputs, { monthly: [], milestones: [] });
assert(mid.score > 20 && mid.score < 70, `mid score in range (got ${mid.score})`);

const strongInputs: ReputationInputs = {
  mergedPullRequests: 20,
  maintainerReviewComments: 40,
  activeMonths: 12,
  uniqueRepos: 10,
  documentationContributions: 6,
  issueDiscussions: 20,
  codeReviews: 25,
};

const strong = calculateReputation(strongInputs, {
  monthly: [],
  milestones: [],
});
assert(strong.score >= 85, `strong builder score (got ${strong.score})`);
assert(strong.score <= 100, "score capped at 100");

const boosted = {
  ...midInputs,
  mergedPullRequests: midInputs.mergedPullRequests + 6,
};
const afterBoost = calculateReputation(boosted, {
  monthly: [],
  milestones: [],
});
assert(afterBoost.score > mid.score, "score updates when merges increase");

const now = new Date(Date.UTC(2026, 6, 15)); // Jul 2026
const stamps = [
  "2026-07-01T00:00:00.000Z",
  "2026-06-01T00:00:00.000Z",
  "2026-06-20T00:00:00.000Z",
  "2025-01-01T00:00:00.000Z", // outside window
];
assert(countActiveMonths(stamps, 12, now) === 2, "active months in window");

const prs: PullRequestPortfolioItem[] = [
  {
    id: "1",
    number: 1,
    title: "docs: fix readme",
    status: "merged",
    merged: true,
    repoFullName: "acme/one",
    htmlUrl: "https://github.com/acme/one/pull/1",
    createdAt: "2026-06-01T00:00:00.000Z",
    mergedAt: "2026-06-02T00:00:00.000Z",
    labels: [],
    language: "TypeScript",
    filesChanged: 1,
    additions: 5,
    deletions: 1,
    reviewComments: 0,
    contributionType: "documentation",
  },
  {
    id: "2",
    number: 2,
    title: "feat: chart",
    status: "open",
    merged: false,
    repoFullName: "acme/two",
    htmlUrl: "https://github.com/acme/two/pull/2",
    createdAt: "2026-07-01T00:00:00.000Z",
    mergedAt: null,
    labels: [],
    language: "TypeScript",
    filesChanged: 2,
    additions: 40,
    deletions: 2,
    reviewComments: 1,
    contributionType: "feature",
  },
];

const monthly = buildMonthlyProgress(
  {
    pullRequests: prs,
    issueTimestamps: ["2026-07-03T00:00:00.000Z"],
    reviewTimestamps: ["2026-06-10T00:00:00.000Z"],
  },
  now,
);
assert(monthly.length === 12, "twelve months");
const june = monthly.find((m) => m.key === "2026-06");
const july = monthly.find((m) => m.key === "2026-07");
assert(june?.merged === 1 && june.reviews === 1, "june bucket");
assert(july?.opened === 1 && july.issues === 1, "july bucket");

const milestones = buildReputationMilestones({
  mergedPullRequests: 5,
  uniqueRepos: 3,
  documentationContributions: 1,
  codeReviews: 5,
  issueDiscussions: 3,
  firstMergedAt: "2026-01-01T00:00:00.000Z",
});
assert(milestones.every((m) => m.earned), "all mid milestones earned");
assert(
  milestones.find((m) => m.id === "first-merge")?.earnedAt ===
    "2026-01-01T00:00:00.000Z",
  "first merge timestamp",
);

const locked = buildReputationMilestones({
  ...emptyInputs,
  firstMergedAt: null,
});
assert(locked.every((m) => !m.earned), "empty milestones locked");

// Targets exist for every weight key
for (const id of Object.keys(REPUTATION_WEIGHTS) as Array<
  keyof typeof REPUTATION_WEIGHTS
>) {
  assert(REPUTATION_TARGETS[id] > 0, `target for ${id}`);
}

console.log("verify-reputation: ok");
console.log(`  empty=${empty.score} mid=${mid.score} strong=${strong.score}`);
