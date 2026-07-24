/**
 * Smoke checks for smart issue recommendations.
 * Run: npx tsx scripts/verify-issue-recommendations.ts
 */
import {
  getAllCuratedIssues,
  recommendIssues,
} from "../lib/issues/engine";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const all = getAllCuratedIssues();
assert(all.length >= 15, "curated issue catalog should be populated");

const beginner = recommendIssues(
  {
    completedRoadmapSlugs: [],
    completedProjectSlugs: [],
    languages: ["TypeScript"],
    level: 1,
    githubActivityCount: 2,
    recommendedRepoIds: ["mempool", "rtl"],
  },
  { limit: 10, maxPerRepo: 2 },
);

assert(beginner.length > 0, "beginner should get recommendations");
assert(
  beginner.every((item) => item.reasons.length > 0),
  "every recommendation explains why",
);
assert(
  new Set(beginner.map((item) => item.issue.id)).size === beginner.length,
  "no duplicate issue ids",
);

const perRepo = new Map<string, number>();
for (const item of beginner) {
  perRepo.set(item.issue.repoId, (perRepo.get(item.issue.repoId) ?? 0) + 1);
}
assert(
  [...perRepo.values()].every((count) => count <= 2),
  "max 2 issues per repo",
);

const dismissedId = beginner[0]!.issue.id;
const afterDismiss = recommendIssues(
  {
    completedRoadmapSlugs: ["lightning"],
    completedProjectSlugs: ["mini-wallet"],
    languages: ["Go", "TypeScript"],
    level: 3,
    githubActivityCount: 20,
    recommendedRepoIds: ["lnd", "ldk"],
    dismissedIssueIds: [dismissedId],
    savedIssueIds: [],
  },
  { limit: 12, maxPerRepo: 2 },
);
assert(
  afterDismiss.every((item) => item.issue.id !== dismissedId),
  "dismissed issues excluded",
);

const savedId = all.find((issue) => issue.category === "bug_fix")!.id;
const withSaved = recommendIssues(
  {
    completedRoadmapSlugs: ["bitcoin"],
    completedProjectSlugs: [],
    languages: ["Rust"],
    level: 4,
    githubActivityCount: 5,
    recommendedRepoIds: ["bdk"],
    savedIssueIds: [savedId],
  },
  { limit: 8, maxPerRepo: 2 },
);
assert(
  withSaved.some((item) => item.issue.id === savedId),
  "saved issues remain recommendable",
);

const docsOnly = recommendIssues(
  {
    completedRoadmapSlugs: ["bitcoin"],
    completedProjectSlugs: [],
    languages: ["Rust"],
    level: 2,
    githubActivityCount: 1,
    recommendedRepoIds: ["rust-bitcoin"],
  },
  { limit: 10, category: "documentation", maxPerRepo: 3 },
);
assert(
  docsOnly.every((item) => item.issue.category === "documentation"),
  "category filter",
);

console.log("Issue recommendation checks passed.");
