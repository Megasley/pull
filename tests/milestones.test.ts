import { describe, expect, it } from "vitest";

import { buildMilestoneCopy, MILESTONE_TITLES } from "@/lib/milestones/copy";
import { formatRelativeTimestamp } from "@/lib/milestones/format";
import { derivePrMilestoneCandidates, type PrSyncResult } from "@/lib/milestones/pr-signals";
import { MILESTONE_TYPES } from "@/lib/milestones/types";
import type { ExistingPullRequestForSync, PullRequestSyncInput } from "@/lib/github/store";

function baseInput(overrides: Partial<PullRequestSyncInput> = {}): PullRequestSyncInput {
  return {
    githubId: 1,
    number: 1,
    title: "Fix bug",
    state: "open",
    merged: false,
    draft: false,
    enriched: true,
    repoFullName: "bitcoin/bitcoin",
    htmlUrl: "https://github.com/bitcoin/bitcoin/pull/1",
    githubCreatedAt: "2025-01-01T00:00:00.000Z",
    githubClosedAt: null,
    githubMergedAt: null,
    isOwnRepo: false,
    attributedPartnerId: null,
    attributedOpportunityEventId: null,
    ...overrides,
  };
}

function existing(overrides: Partial<ExistingPullRequestForSync> = {}): ExistingPullRequestForSync {
  return {
    id: "pr-1",
    githubId: 1,
    state: "open",
    merged: false,
    draft: false,
    filesChanged: 0,
    additions: 0,
    deletions: 0,
    reviewComments: 0,
    githubMergedAt: null,
    githubClosedAt: null,
    ...overrides,
  };
}

function types(candidates: ReturnType<typeof derivePrMilestoneCandidates>) {
  return candidates.map((c) => c.milestoneType).sort();
}

describe("milestones/pr-signals — derivePrMilestoneCandidates", () => {
  it("a brand new, non-draft PR yields both 'opened' and 'submitted'", () => {
    const results: PrSyncResult[] = [
      { input: baseInput({ draft: false }), pullRequestId: "pr-1", previous: null },
    ];
    expect(types(derivePrMilestoneCandidates(results, "user-1"))).toEqual([
      "first_pr_opened",
      "first_pr_submitted",
    ]);
  });

  it("a brand new draft PR yields only 'opened', never 'submitted'", () => {
    const results: PrSyncResult[] = [
      { input: baseInput({ draft: true }), pullRequestId: "pr-1", previous: null },
    ];
    expect(types(derivePrMilestoneCandidates(results, "user-1"))).toEqual(["first_pr_opened"]);
  });

  it("a PR still in draft on a later sync yields nothing", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({ draft: true, enriched: true }),
        pullRequestId: "pr-1",
        previous: existing({ draft: true }),
      },
    ];
    expect(derivePrMilestoneCandidates(results, "user-1")).toEqual([]);
  });

  it("a real draft->ready transition yields 'submitted', not 'opened' (PR already existed)", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({ draft: false, enriched: true }),
        pullRequestId: "pr-1",
        previous: existing({ draft: true }),
      },
    ];
    expect(types(derivePrMilestoneCandidates(results, "user-1"))).toEqual(["first_pr_submitted"]);
  });

  it("does not treat a carried-forward (unenriched) draft value as a transition", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({ draft: false, enriched: false }),
        pullRequestId: "pr-1",
        previous: existing({ draft: true }),
      },
    ];
    expect(derivePrMilestoneCandidates(results, "user-1")).toEqual([]);
  });

  it("a merge transition into someone else's repo yields both 'merged' and 'verified'", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({
          merged: true,
          githubMergedAt: "2025-02-01T00:00:00.000Z",
          isOwnRepo: false,
        }),
        pullRequestId: "pr-1",
        previous: existing({ merged: false }),
      },
    ];
    expect(types(derivePrMilestoneCandidates(results, "user-1"))).toEqual([
      "first_pr_merged",
      "first_verified_contribution",
    ]);
  });

  it("a merge into the user's own repo yields 'merged' only, never 'verified'", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({
          merged: true,
          githubMergedAt: "2025-02-01T00:00:00.000Z",
          isOwnRepo: true,
        }),
        pullRequestId: "pr-1",
        previous: existing({ merged: false }),
      },
    ];
    expect(types(derivePrMilestoneCandidates(results, "user-1"))).toEqual(["first_pr_merged"]);
  });

  it("a PR already merged as of the previous sync yields nothing new", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({ merged: true, githubMergedAt: "2025-02-01T00:00:00.000Z" }),
        pullRequestId: "pr-1",
        previous: existing({ merged: true, githubMergedAt: "2025-02-01T00:00:00.000Z" }),
      },
    ];
    expect(derivePrMilestoneCandidates(results, "user-1")).toEqual([]);
  });

  it("a brand new PR discovered already merged yields opened + merged + verified together", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({
          draft: false,
          merged: true,
          state: "closed",
          githubMergedAt: "2025-02-01T00:00:00.000Z",
          isOwnRepo: false,
        }),
        pullRequestId: "pr-1",
        previous: null,
      },
    ];
    expect(types(derivePrMilestoneCandidates(results, "user-1"))).toEqual([
      "first_pr_merged",
      "first_pr_opened",
      "first_pr_submitted",
      "first_verified_contribution",
    ].sort());
  });

  it("is a pure function — calling it twice with identical input produces identical output", () => {
    const results: PrSyncResult[] = [
      { input: baseInput(), pullRequestId: "pr-1", previous: null },
    ];
    const first = derivePrMilestoneCandidates(results, "user-1");
    const second = derivePrMilestoneCandidates(results, "user-1");
    expect(second).toEqual(first);
  });

  it("carries repo/PR context onto every candidate", () => {
    const results: PrSyncResult[] = [
      {
        input: baseInput({ repoFullName: "lightningdevkit/rust-lightning", number: 42 }),
        pullRequestId: "pr-1",
        previous: null,
      },
    ];
    const [candidate] = derivePrMilestoneCandidates(results, "user-1");
    expect(candidate.repository).toBe("lightningdevkit/rust-lightning");
    expect(candidate.pullRequestNumber).toBe(42);
    expect(candidate.userId).toBe("user-1");
  });
});

describe("milestones/copy — buildMilestoneCopy", () => {
  it("every milestone type has a title and produces a description mentioning the builder", () => {
    for (const type of MILESTONE_TYPES) {
      const copy = buildMilestoneCopy(type, "Kingsley");
      expect(copy.title).toBe(MILESTONE_TITLES[type]);
      expect(copy.description).toContain("Kingsley");
    }
  });

  it("matches the specified copy for first PR opened / submitted / merged", () => {
    expect(buildMilestoneCopy("first_pr_opened", "Kingsley").description).toBe(
      "Kingsley just opened their first tracked pull request.",
    );
    expect(buildMilestoneCopy("first_pr_submitted", "Ada").description).toBe(
      "Ada submitted their first pull request for review.",
    );
    expect(buildMilestoneCopy("first_pr_merged", "Kingsley").description).toBe(
      "Kingsley just had their first tracked pull request merged.",
    );
  });
});

describe("milestones/format — formatRelativeTimestamp", () => {
  const now = Date.parse("2026-01-01T12:00:00.000Z");

  it("formats minutes, hours, and days ago", () => {
    expect(formatRelativeTimestamp("2026-01-01T11:52:00.000Z", now)).toBe("8 minutes ago");
    expect(formatRelativeTimestamp("2026-01-01T10:00:00.000Z", now)).toBe("2 hours ago");
    expect(formatRelativeTimestamp("2025-12-30T12:00:00.000Z", now)).toBe("2 days ago");
  });

  it("falls back to a date beyond a week", () => {
    expect(formatRelativeTimestamp("2025-12-01T12:00:00.000Z", now)).toBe(
      new Date(Date.parse("2025-12-01T12:00:00.000Z")).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    );
  });
});
