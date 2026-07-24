/**
 * Smoke checks for PR portfolio filters.
 * Run: npx tsx scripts/verify-portfolio.ts
 */
import {
  filterPortfolioItems,
  inferContributionType,
  toPortfolioItem,
} from "../lib/portfolio/filter";
import type { GithubPullRequestRecord } from "../types/github";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(inferContributionType("docs: fix typo") === "documentation", "docs");
assert(inferContributionType("fix mempool bug", ["bug"]) === "bug_fix", "bug");
assert(inferContributionType("feat: add dark mode") === "feature", "feature");

const fixtures: GithubPullRequestRecord[] = [
  {
    id: "1",
    githubId: 1,
    number: 10,
    title: "feat: add explorer chart",
    state: "closed",
    merged: true,
    repoFullName: "mempool/mempool",
    htmlUrl: "https://github.com/mempool/mempool/pull/10",
    githubCreatedAt: "2026-06-01T00:00:00.000Z",
    githubMergedAt: "2026-06-02T00:00:00.000Z",
    labels: ["enhancement"],
    language: "TypeScript",
    filesChanged: 4,
    additions: 120,
    deletions: 12,
    reviewComments: 3,
    contributionType: "feature",
  },
  {
    id: "2",
    githubId: 2,
    number: 3,
    title: "wip experiment",
    state: "open",
    merged: false,
    repoFullName: "acme/tools",
    htmlUrl: "https://github.com/acme/tools/pull/3",
    githubCreatedAt: "2026-07-01T00:00:00.000Z",
    githubMergedAt: null,
    labels: [],
    language: "Rust",
    filesChanged: 1,
    additions: 10,
    deletions: 0,
    reviewComments: 0,
    contributionType: "other",
  },
];

const items = fixtures.map(toPortfolioItem);
assert(items[0]?.status === "merged", "merged status");
assert(items[1]?.status === "open", "open status");

const merged = filterPortfolioItems(items, {
  query: "",
  status: "all",
  language: "all",
  contributionType: "all",
  mergedOnly: true,
});
assert(merged.length === 1 && merged[0]?.merged, "merged filter");

const search = filterPortfolioItems(items, {
  query: "mempool",
  status: "all",
  language: "all",
  contributionType: "all",
});
assert(search.length === 1, "search repo");

const byLang = filterPortfolioItems(items, {
  query: "",
  status: "all",
  language: "Rust",
  contributionType: "all",
});
assert(byLang.length === 1 && byLang[0]?.language === "Rust", "language filter");

console.log("PR portfolio checks passed.");
