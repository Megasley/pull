/**
 * Smoke checks for Builder Portfolio helpers.
 * Run: npx tsx scripts/verify-builder-portfolio.ts
 */
import {
  deriveTechnologies,
  parseSkillsInput,
  selectFeaturedRepositories,
  selectMergedPrHighlights,
  toPublicTimelineEvents,
} from "../lib/profile/portfolio";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const skills = parseSkillsInput("TypeScript, Rust, TypeScript, Open Source\nSystems");
assert(skills.length === 4, "dedupe skills");
assert(skills[0] === "TypeScript", "first skill");

const emptySkills = parseSkillsInput("  ,  \n ");
assert(emptySkills.length === 0, "empty skills");

const repos = [
  { id: "a", isPinned: false, stargazersCount: 10 },
  { id: "b", isPinned: true, stargazersCount: 1 },
  { id: "c", isPinned: true, stargazersCount: 2 },
  { id: "d", isPinned: false, stargazersCount: 50 },
];
const featured = selectFeaturedRepositories(repos, 6);
assert(featured.length === 2 && featured[0]?.id === "b", "prefer pinned");

const unpinned = selectFeaturedRepositories(
  repos.filter((r) => !r.isPinned),
  2,
);
assert(unpinned[0]?.id === "d", "fallback stars");

const prs = [
  { id: "1", merged: true, reviewComments: 1, mergedAt: "2026-01-01T00:00:00.000Z" },
  { id: "2", merged: true, reviewComments: 5, mergedAt: "2026-02-01T00:00:00.000Z" },
  { id: "3", merged: false, reviewComments: 9, mergedAt: null },
];
const highlights = selectMergedPrHighlights(prs, 2);
assert(highlights.length === 2 && highlights[0]?.id === "2", "highlight ranking");

const tech = deriveTechnologies(["TypeScript", "Rust", "TypeScript", null, "Go"]);
assert(tech[0]?.name === "TypeScript" && tech[0].count === 2, "tech counts");
assert(tech.length === 3, "tech length");

const timeline = toPublicTimelineEvents([
  { href: "https://github.com/a/b/pull/1", type: "merged" },
  { href: "/projects/foo/submit", type: "project_submission" },
  { href: "/review/abc", type: "review" },
  { href: "/roadmaps/bitcoin", type: "roadmap_completion" },
]);
assert(timeline[1]?.href === "/projects/foo", "sanitize submit");
assert(timeline[2]?.href === null, "drop review");
assert(timeline[3]?.href === "/roadmaps/bitcoin", "keep public");

console.log("verify-builder-portfolio: ok");
