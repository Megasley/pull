import { describe, expect, it } from "vitest";

import { classifyPullRequest } from "@/lib/portfolio/pr-role";
import {
  selectFeaturedRepositories,
  selectMaintainerBadge,
  selectMergedPrHighlights,
} from "@/lib/profile/portfolio";
import {
  normalizePrTitleForDisplay,
  truncateOnWordBoundary,
} from "@/lib/portfolio/pr-title";

describe("portfolio/pr-role — classifyPullRequest", () => {
  it("classifies a PR into the builder's own repo as self", () => {
    expect(
      classifyPullRequest(
        { repoFullName: "megasley/pull", isOwnRepo: true },
        { maintainedRepoFullNames: new Set() },
      ),
    ).toBe("self");
  });

  it("classifies a PR into a repo the builder maintains (not owned) as maintainer", () => {
    expect(
      classifyPullRequest(
        { repoFullName: "acme/widgets", isOwnRepo: false },
        { maintainedRepoFullNames: new Set(["acme/widgets"]) },
      ),
    ).toBe("maintainer");
  });

  it("classifies a PR into an unrelated repo as external", () => {
    expect(
      classifyPullRequest(
        { repoFullName: "bitcoin/bitcoin", isOwnRepo: false },
        { maintainedRepoFullNames: new Set(["acme/widgets"]) },
      ),
    ).toBe("external");
  });

  it("treats isOwnRepo as ground truth even if the repo also appears in the maintained set", () => {
    expect(
      classifyPullRequest(
        { repoFullName: "megasley/pull", isOwnRepo: true },
        { maintainedRepoFullNames: new Set(["megasley/pull"]) },
      ),
    ).toBe("self");
  });
});

describe("profile/portfolio — selectMergedPrHighlights sorts external first", () => {
  const base = {
    merged: true,
    reviewComments: 0,
    mergedAt: "2026-01-01T00:00:00Z",
    title: "",
  };

  it("puts external PRs ahead of maintainer and self PRs regardless of review comments", () => {
    const items = [
      { ...base, title: "self one", role: "self" as const, reviewComments: 50 },
      { ...base, title: "maintainer one", role: "maintainer" as const, reviewComments: 20 },
      { ...base, title: "external one", role: "external" as const, reviewComments: 0 },
    ];

    const result = selectMergedPrHighlights(items);
    expect(result.map((item) => item.role)).toEqual(["external", "maintainer", "self"]);
  });

  it("still breaks ties within a role by review comments, then recency", () => {
    const items = [
      { ...base, title: "a", role: "external" as const, reviewComments: 1 },
      { ...base, title: "b", role: "external" as const, reviewComments: 5 },
    ];

    const result = selectMergedPrHighlights(items);
    expect(result.map((item) => item.title)).toEqual(["b", "a"]);
  });

  it("caps at 5 by default", () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      ...base,
      title: `pr-${i}`,
      role: "external" as const,
    }));
    expect(selectMergedPrHighlights(items)).toHaveLength(5);
  });

  it("drops duplicate branch-pushed titles, keeping the highest-signal instance", () => {
    const items = [
      { ...base, title: "Feat/partners", role: "self" as const, reviewComments: 0 },
      { ...base, title: "Feat/partners", role: "self" as const, reviewComments: 3 },
    ];
    expect(selectMergedPrHighlights(items)).toHaveLength(1);
  });
});

describe("profile/portfolio — selectFeaturedRepositories", () => {
  const repos = [
    { id: "a", fullName: "me/a", isPinned: false, stargazersCount: 10 },
    { id: "b", fullName: "me/b", isPinned: true, stargazersCount: 1 },
    { id: "c", fullName: "me/c", isPinned: false, stargazersCount: 50 },
  ];

  it("falls back to top-starred when nothing is pinned", () => {
    const result = selectFeaturedRepositories(repos.filter((r) => !r.isPinned));
    expect(result.map((r) => r.id)).toEqual(["c", "a"]);
  });

  it("prefers GitHub pins over stars when the builder has no explicit pins", () => {
    const result = selectFeaturedRepositories(repos);
    expect(result.map((r) => r.id)).toEqual(["b"]);
  });

  it("prefers the builder's own ordered pins over everything else", () => {
    const result = selectFeaturedRepositories(repos, ["me/c", "me/a"]);
    expect(result.map((r) => r.id)).toEqual(["c", "a"]);
  });

  it("ignores a pinned full name that no longer matches a synced repo", () => {
    const result = selectFeaturedRepositories(repos, ["nonexistent/repo"]);
    // Falls through to the GitHub-pin / stars ranking rather than returning empty.
    expect(result.map((r) => r.id)).toEqual(["b"]);
  });

  it("caps at the given limit", () => {
    const result = selectFeaturedRepositories(repos, ["me/c", "me/a", "me/b"], 2);
    expect(result).toHaveLength(2);
  });
});

describe("profile/portfolio — selectMaintainerBadge", () => {
  const repo = (overrides: Partial<{
    fullName: string;
    name: string;
    forksCount: number;
    stargazersCount: number;
    isFork: boolean;
  }> = {}) => ({
    fullName: "megasley/pull",
    name: "pull",
    forksCount: 0,
    stargazersCount: 0,
    isFork: false,
    ...overrides,
  });

  it("returns null when no owned repo has outside signal", () => {
    expect(selectMaintainerBadge([repo()], "megasley")).toBeNull();
  });

  it("badges an owned repo with forks", () => {
    expect(selectMaintainerBadge([repo({ forksCount: 2 })], "megasley")).toEqual({
      name: "pull",
      fullName: "megasley/pull",
    });
  });

  it("badges an owned repo with at least 3 stars", () => {
    expect(selectMaintainerBadge([repo({ stargazersCount: 3 })], "megasley")).toEqual({
      name: "pull",
      fullName: "megasley/pull",
    });
  });

  it("ignores a repo the builder doesn't own", () => {
    expect(
      selectMaintainerBadge(
        [repo({ fullName: "acme/widgets", name: "widgets", stargazersCount: 10 })],
        "megasley",
      ),
    ).toBeNull();
  });

  it("ignores forks even with outside signal", () => {
    expect(
      selectMaintainerBadge([repo({ isFork: true, stargazersCount: 10 })], "megasley"),
    ).toBeNull();
  });

  it("picks the repo with the highest combined stars+forks", () => {
    const result = selectMaintainerBadge(
      [
        repo({ fullName: "megasley/small", name: "small", stargazersCount: 3 }),
        repo({ fullName: "megasley/big", name: "big", stargazersCount: 10, forksCount: 2 }),
      ],
      "megasley",
    );
    expect(result).toEqual({ name: "big", fullName: "megasley/big" });
  });
});

describe("portfolio/pr-title — normalizePrTitleForDisplay", () => {
  it("strips a conventional-commit prefix", () => {
    expect(normalizePrTitleForDisplay("feat: add Dada Devs as a learning partner")).toBe(
      "add Dada Devs as a learning partner",
    );
  });

  it("normalizes a branch-style title into sentence case with spaces", () => {
    expect(normalizePrTitleForDisplay("Fix/backfill-pr-review-created-at")).toBe(
      "Backfill pr review created at",
    );
  });

  it("normalizes a branch-style title using slashes as the only separator", () => {
    expect(normalizePrTitleForDisplay("Feat/pr-review-dashboard")).toBe(
      "Pr review dashboard",
    );
  });

  it("leaves an already-readable sentence title unchanged", () => {
    expect(normalizePrTitleForDisplay("fix: removed staled PRs")).toBe(
      "removed staled PRs",
    );
  });

  it("does not mangle a title with real spaces even if it contains dashes", () => {
    expect(normalizePrTitleForDisplay("Add first-contribution onboarding flow")).toBe(
      "Add first-contribution onboarding flow",
    );
  });

  it("handles an empty title without throwing", () => {
    expect(normalizePrTitleForDisplay("")).toBe("");
  });
});

describe("portfolio/pr-title — truncateOnWordBoundary", () => {
  it("returns the text unchanged when it already fits", () => {
    expect(truncateOnWordBoundary("short title", 40)).toBe("short title");
  });

  it("truncates on the nearest word boundary, never mid-word", () => {
    const text = "feat: expand PR review discovery dashboard - UX, self-report, size signal";
    const result = truncateOnWordBoundary(text, 44);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toBe("feat: expand PR review discovery dashboard - UX, self-report, size si…");
    expect(text.startsWith(result.slice(0, -1))).toBe(true);
  });

  it("never cuts a word in half", () => {
    const result = truncateOnWordBoundary("abcdefghij klmnopqrst", 15);
    expect(result).toBe("abcdefghij…");
  });
});
