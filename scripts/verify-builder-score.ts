/**
 * Smoke checks for Builder Score scenarios (no DB required).
 * Run: npx tsx scripts/verify-builder-score.ts
 */
import { calculateBuilderScore, countActiveWeeks, saturate } from "../lib/score";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function scenario(
  name: string,
  inputs: Parameters<typeof calculateBuilderScore>[0],
) {
  const result = calculateBuilderScore(inputs);
  console.log(
    `${name.padEnd(28)} score=${String(result.score).padStart(3)}  factors=${result.factors
      .map((f) => `${f.id}:${f.strengthPercent}`)
      .join(" ")}`,
  );
  return result;
}

const empty = scenario("new builder", {
  projectsCompleted: 0,
  projectsApproved: 0,
  roadmapsCompleted: 0,
  openSourceContributions: 0,
  communityReviews: 0,
  activeWeeks: 0,
});
assert(empty.score === 0, "empty should be 0");

const learner = scenario("lesson-heavy learner", {
  projectsCompleted: 2,
  projectsApproved: 0,
  roadmapsCompleted: 0,
  openSourceContributions: 0,
  communityReviews: 0,
  activeWeeks: 3,
});
assert(learner.score > 0 && learner.score < 40, "learner mid-low band");

const approved = scenario("after approvals", {
  projectsCompleted: 3,
  projectsApproved: 2,
  roadmapsCompleted: 0,
  openSourceContributions: 1,
  communityReviews: 0,
  activeWeeks: 4,
});
assert(approved.score > learner.score, "approvals should raise score");

const veteran = scenario("veteran builder", {
  projectsCompleted: 10,
  projectsApproved: 6,
  roadmapsCompleted: 2,
  openSourceContributions: 8,
  communityReviews: 12,
  activeWeeks: 7,
});
assert(veteran.score >= 75, "veteran should be high");
assert(veteran.score <= 100, "score capped at 100");

const soft = saturate(5, 5);
assert(soft > 0.7 && soft < 1, `saturate at target should be high but <1 got ${soft}`);

const weeks = countActiveWeeks(
  [
    "2026-07-01T12:00:00.000Z",
    "2026-07-08T12:00:00.000Z",
    "2026-07-15T12:00:00.000Z",
    "2026-05-01T12:00:00.000Z", // outside window
  ],
  8,
  new Date("2026-07-22T12:00:00.000Z"),
);
assert(weeks === 3, `expected 3 active weeks, got ${weeks}`);

console.log("\nAll Builder Score scenario checks passed.");
