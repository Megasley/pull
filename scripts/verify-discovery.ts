/**
 * Smoke checks for Contribution Discovery filters/recommendations.
 * Run: npx tsx scripts/verify-discovery.ts
 */
import {
  filterDiscoveryRepositories,
  getAllDiscoveryRepositories,
  recommendDiscoveryRepositories,
} from "../lib/discovery/catalog";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const all = getAllDiscoveryRepositories();
assert(all.length >= 8, "catalog should have curated repos");
assert(all.every((repo) => repo.url.startsWith("https://github.com/")), "repo links");

const rust = filterDiscoveryRepositories(all, {
  query: "",
  language: "Rust",
  topic: "all",
  difficulty: "all",
  size: "all",
});
assert(rust.every((repo) => repo.language === "Rust"), "language filter");
assert(rust.length >= 2, "multiple rust targets");

const search = filterDiscoveryRepositories(all, {
  query: "wallet",
  language: "all",
  topic: "all",
  difficulty: "all",
  size: "all",
});
assert(search.length > 0, "search should find wallet-related repos");

const beginner = filterDiscoveryRepositories(all, {
  query: "",
  language: "all",
  topic: "all",
  difficulty: "beginner",
  size: "small",
});
assert(
  beginner.every((repo) => repo.difficulty === "beginner" && repo.size === "small"),
  "difficulty + size filters",
);

const lightningRecs = recommendDiscoveryRepositories({
  completedRoadmapSlugs: ["lightning"],
  languages: ["TypeScript", "Go"],
  level: 2,
});
assert(lightningRecs.length > 0, "recommendations returned");
assert(
  lightningRecs.some((item) => item.repository.tracks.includes("lightning")),
  "lightning track should surface",
);
assert(
  lightningRecs.every((item) => item.reasons.length > 0),
  "every recommendation explains why",
);

const bookmarked = filterDiscoveryRepositories(
  all,
  {
    query: "",
    language: "all",
    topic: "all",
    difficulty: "all",
    size: "all",
    bookmarkedOnly: true,
  },
  [all[0]!.id],
);
assert(bookmarked.length === 1 && bookmarked[0]!.id === all[0]!.id, "bookmarks filter");

console.log("Contribution discovery checks passed.");
