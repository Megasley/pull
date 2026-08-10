/**
 * Smoke checks for Repository Explorer filters/pagination.
 * Run: npx tsx scripts/verify-repo-explorer.ts
 */
import {
  filterAndSortRepositories,
  getRepoContributionStatus,
  getRepositoryLanguages,
  paginateRepositories,
} from "../lib/github/explorer";
import type { GithubRepositoryRecord } from "../types/github";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function repo(
  partial: Partial<GithubRepositoryRecord> &
    Pick<GithubRepositoryRecord, "id" | "name">,
): GithubRepositoryRecord {
  return {
    githubId: Number(partial.id) || 1,
    fullName: `acme/${partial.name}`,
    description: partial.description ?? null,
    htmlUrl: `https://github.com/acme/${partial.name}`,
    language: partial.language ?? null,
    stargazersCount: partial.stargazersCount ?? 0,
    forksCount: partial.forksCount ?? 0,
    openIssuesCount: partial.openIssuesCount ?? 0,
    licenseSpdx: partial.licenseSpdx ?? null,
    topics: partial.topics ?? [],
    isFork: partial.isFork ?? false,
    isPrivate: partial.isPrivate ?? false,
    isPinned: partial.isPinned ?? false,
    defaultBranch: "main",
    pushedAt: partial.pushedAt ?? null,
    githubUpdatedAt: partial.githubUpdatedAt ?? null,
    ...partial,
  };
}

const now = Date.now();
const fixtures: GithubRepositoryRecord[] = [
  repo({
    id: "1",
    name: "alpha",
    language: "TypeScript",
    stargazersCount: 10,
    topics: ["bitcoin"],
    isPinned: true,
    pushedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  repo({
    id: "2",
    name: "bravo",
    language: "Rust",
    stargazersCount: 50,
    description: "Lightning toolkit",
    pushedAt: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  repo({
    id: "3",
    name: "charlie-fork",
    language: "TypeScript",
    stargazersCount: 2,
    isFork: true,
    pushedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  repo({
    id: "4",
    name: "delta",
    language: "Go",
    stargazersCount: 7,
    licenseSpdx: "MIT",
    pushedAt: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
  }),
];

const languages = getRepositoryLanguages(fixtures);
assert(languages[0] === "TypeScript", "TypeScript should be top language");
assert(languages.includes("Rust"), "Rust present");

const byStars = filterAndSortRepositories(fixtures, {
  query: "",
  language: "all",
  sort: "stars",
});
assert(byStars[0]?.name === "alpha", "pinned should lead stars sort");
assert(byStars[1]?.name === "bravo", "most starred non-pinned next");

const rustOnly = filterAndSortRepositories(fixtures, {
  query: "",
  language: "Rust",
  sort: "name",
});
assert(rustOnly.length === 1 && rustOnly[0]?.name === "bravo", "language filter");

const search = filterAndSortRepositories(fixtures, {
  query: "lightning",
  language: "all",
  sort: "recent",
});
assert(search.length === 1 && search[0]?.name === "bravo", "search description");

const page1 = paginateRepositories(
  filterAndSortRepositories(fixtures, { query: "", language: "all", sort: "name" }),
  1,
  2,
);
assert(page1.items.length === 2, "page size 2");
assert(page1.totalPages === 2, "2 pages");
assert(page1.hasNext, "has next");

assert(getRepoContributionStatus(fixtures[0]!, now) === "pinned", "pinned status");
assert(
  getRepoContributionStatus(fixtures[1]!, now) === "maintained",
  "maintained status",
);
assert(getRepoContributionStatus(fixtures[2]!, now) === "fork", "fork status");
assert(getRepoContributionStatus(fixtures[3]!, now) === "quiet", "quiet status");

console.log("Repository explorer checks passed.");
