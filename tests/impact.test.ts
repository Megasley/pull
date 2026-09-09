import { describe, expect, it } from "vitest";

import {
  isQualifyingContribution,
  isRepeatContributor,
  isSustainedContributor,
  isVerifiedContributor,
  monthBucket,
} from "@/lib/impact/definitions";
import { summarizeCounts, summarizeDurations } from "@/lib/impact/stats";
import {
  resolveOpportunityAttribution,
  resolvePartnerAttribution,
  type OpportunityClickForAttribution,
  type PartnerMembershipForAttribution,
} from "@/lib/github/attribution";
import { deriveLifecycleEvents, type ExistingPullRequestForSync, type PullRequestSyncInput } from "@/lib/github/store";
import { deriveAcquisitionSignal } from "@/lib/auth/acquisition";
import { getCountryCodesForRegion, isAfricanCountry, isKnownCountryCode } from "@/lib/geo/countries";

describe("impact/definitions — qualifying contribution rules", () => {
  it("counts a merged PR into someone else's repo as qualifying", () => {
    expect(isQualifyingContribution({ merged: true, isOwnRepo: false })).toBe(true);
  });

  it("excludes a merged PR into the contributor's own repo", () => {
    expect(isQualifyingContribution({ merged: true, isOwnRepo: true })).toBe(false);
  });

  it("excludes an unmerged PR regardless of repo ownership", () => {
    expect(isQualifyingContribution({ merged: false, isOwnRepo: false })).toBe(false);
  });

  it("excludes a merged PR into the First Contribution practice repo", () => {
    expect(
      isQualifyingContribution({ merged: true, isOwnRepo: false, isPracticeRepo: true }),
    ).toBe(false);
  });

  it("still qualifies a merged PR when isPracticeRepo is omitted (back-compat default)", () => {
    expect(isQualifyingContribution({ merged: true, isOwnRepo: false })).toBe(true);
  });

  it("verified/repeat contributor thresholds match the documented definitions", () => {
    expect(isVerifiedContributor(0)).toBe(false);
    expect(isVerifiedContributor(1)).toBe(true);
    expect(isRepeatContributor(1)).toBe(false);
    expect(isRepeatContributor(2)).toBe(true);
  });

  it("sustained contributor requires at least 3 distinct months", () => {
    expect(isSustainedContributor(2)).toBe(false);
    expect(isSustainedContributor(3)).toBe(true);
  });

  it("monthBucket extracts a stable YYYY-MM key", () => {
    expect(monthBucket("2026-03-15T10:00:00.000Z")).toBe("2026-03");
  });
});

describe("impact/stats — duration and count summaries", () => {
  it("treats an empty set as no data, not zero", () => {
    const summary = summarizeDurations([], 5);
    expect(summary.completed).toBe(0);
    expect(summary.pending).toBe(5);
    expect(summary.medianDays).toBeNull();
  });

  it("never folds pending (incomplete-journey) subjects into the duration stats", () => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const summary = summarizeDurations([oneDayMs, oneDayMs * 3], 10);
    expect(summary.completed).toBe(2);
    expect(summary.pending).toBe(10);
    expect(summary.medianDays).toBeGreaterThan(0);
  });

  it("computes a sane median for an odd-length sample", () => {
    const day = 24 * 60 * 60 * 1000;
    const summary = summarizeDurations([1 * day, 2 * day, 3 * day], 0);
    expect(summary.medianDays).toBe(2);
  });

  it("summarizeCounts returns null for an empty sample", () => {
    expect(summarizeCounts([]).medianCount).toBeNull();
  });

  it("summarizeCounts computes median/mean correctly", () => {
    const result = summarizeCounts([1, 2, 3, 4]);
    expect(result.medianCount).toBe(2.5);
    expect(result.meanCount).toBe(2.5);
  });
});

describe("github/attribution — partner attribution", () => {
  const memberships: PartnerMembershipForAttribution[] = [
    { organizationId: "org-early", joinedAt: "2025-01-01T00:00:00.000Z" },
    { organizationId: "org-late", joinedAt: "2025-06-01T00:00:00.000Z" },
  ];

  it("attributes to the most recently joined partner active before the contribution", () => {
    const result = resolvePartnerAttribution(memberships, "2025-07-01T00:00:00.000Z");
    expect(result).toBe("org-late");
  });

  it("falls back to the only eligible membership when the contribution predates the later join", () => {
    const result = resolvePartnerAttribution(memberships, "2025-03-01T00:00:00.000Z");
    expect(result).toBe("org-early");
  });

  it("returns null when the contribution predates every membership", () => {
    const result = resolvePartnerAttribution(memberships, "2024-01-01T00:00:00.000Z");
    expect(result).toBeNull();
  });

  it("returns null with no memberships at all", () => {
    expect(resolvePartnerAttribution([], "2025-07-01T00:00:00.000Z")).toBeNull();
  });
});

describe("github/attribution — opportunity click attribution", () => {
  const clicks: OpportunityClickForAttribution[] = [
    { id: "click-old", repoFullName: "bitcoin/bitcoin", createdAt: "2025-01-01T00:00:00.000Z" },
    { id: "click-recent", repoFullName: "bitcoin/bitcoin", createdAt: "2025-06-15T00:00:00.000Z" },
    { id: "click-other-repo", repoFullName: "lightningnetwork/lnd", createdAt: "2025-06-16T00:00:00.000Z" },
  ];

  it("attributes to the closest matching-repo click within the window", () => {
    const result = resolveOpportunityAttribution(clicks, "bitcoin/bitcoin", "2025-06-20T00:00:00.000Z", 30);
    expect(result).toBe("click-recent");
  });

  it("does not attribute across different repos", () => {
    const result = resolveOpportunityAttribution(clicks, "lightningnetwork/lnd", "2025-06-20T00:00:00.000Z", 10);
    expect(result).toBe("click-other-repo");
  });

  it("ignores a click outside the attribution window", () => {
    const result = resolveOpportunityAttribution(clicks, "bitcoin/bitcoin", "2025-06-20T00:00:00.000Z", 3);
    expect(result).toBeNull();
  });

  it("ignores a click that happened after the contribution was opened", () => {
    const result = resolveOpportunityAttribution(clicks, "bitcoin/bitcoin", "2024-12-31T00:00:00.000Z", 365);
    expect(result).toBeNull();
  });
});

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
    isPracticeRepo: false,
    attributedPartnerId: null,
    attributedOpportunityEventId: null,
    ...overrides,
  };
}

describe("github/store — durable lifecycle event derivation", () => {
  it("emits only 'opened' for a brand new open PR — never invents ready_for_review", () => {
    const events = deriveLifecycleEvents(
      [{ input: baseInput(), pullRequestId: "pr-1", previous: null }],
      "user-1",
    );
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("opened");
    expect(events[0].timestampSource).toBe("github");
  });

  it("emits 'opened' and 'merged' for a brand new PR discovered already merged", () => {
    const events = deriveLifecycleEvents(
      [
        {
          input: baseInput({ merged: true, state: "closed", githubMergedAt: "2025-01-02T00:00:00.000Z" }),
          pullRequestId: "pr-1",
          previous: null,
        },
      ],
      "user-1",
    );
    expect(events.map((e) => e.eventType).sort()).toEqual(["merged", "opened"]);
  });

  it("emits 'merged' when a previously-open PR transitions to merged", () => {
    const previous: ExistingPullRequestForSync = {
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
    };
    const events = deriveLifecycleEvents(
      [
        {
          input: baseInput({ merged: true, state: "closed", githubMergedAt: "2025-02-01T00:00:00.000Z" }),
          pullRequestId: "pr-1",
          previous,
        },
      ],
      "user-1",
    );
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("merged");
  });

  it("does not re-emit 'merged' for a PR that was already merged", () => {
    const previous: ExistingPullRequestForSync = {
      id: "pr-1",
      githubId: 1,
      state: "closed",
      merged: true,
      draft: false,
      filesChanged: 0,
      additions: 0,
      deletions: 0,
      reviewComments: 0,
      githubMergedAt: "2025-02-01T00:00:00.000Z",
      githubClosedAt: null,
    };
    const events = deriveLifecycleEvents(
      [
        {
          input: baseInput({ merged: true, state: "closed", githubMergedAt: "2025-02-01T00:00:00.000Z" }),
          pullRequestId: "pr-1",
          previous,
        },
      ],
      "user-1",
    );
    expect(events).toHaveLength(0);
  });

  it("only emits ready_for_review when the sync actually re-verified draft status", () => {
    const previous: ExistingPullRequestForSync = {
      id: "pr-1",
      githubId: 1,
      state: "open",
      merged: false,
      draft: true,
      filesChanged: 0,
      additions: 0,
      deletions: 0,
      reviewComments: 0,
      githubMergedAt: null,
      githubClosedAt: null,
    };

    const unenrichedEvents = deriveLifecycleEvents(
      [{ input: baseInput({ draft: false, enriched: false }), pullRequestId: "pr-1", previous }],
      "user-1",
    );
    expect(unenrichedEvents.some((e) => e.eventType === "ready_for_review")).toBe(false);

    const enrichedEvents = deriveLifecycleEvents(
      [{ input: baseInput({ draft: false, enriched: true }), pullRequestId: "pr-1", previous }],
      "user-1",
    );
    expect(enrichedEvents).toHaveLength(1);
    expect(enrichedEvents[0].eventType).toBe("ready_for_review");
    expect(enrichedEvents[0].timestampSource).toBe("sync_observed");
  });

  it("emits 'closed' for a PR that closes without merging", () => {
    const previous: ExistingPullRequestForSync = {
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
    };
    const events = deriveLifecycleEvents(
      [
        {
          input: baseInput({ state: "closed", merged: false, githubClosedAt: "2025-03-01T00:00:00.000Z" }),
          pullRequestId: "pr-1",
          previous,
        },
      ],
      "user-1",
    );
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("closed");
  });
});

describe("auth/acquisition — first-touch signal derivation", () => {
  it("classifies an invite-link landing path as partner", () => {
    expect(deriveAcquisitionSignal("/invite/o_abc123").source).toBe("partner");
  });

  it("classifies a utm-tagged path as campaign", () => {
    const signal = deriveAcquisitionSignal("/dashboard?utm_source=twitter&utm_campaign=launch");
    expect(signal.source).toBe("campaign");
    expect(signal.detail.utmSource).toBe("twitter");
  });

  it("classifies a ref-tagged path as referral", () => {
    expect(deriveAcquisitionSignal("/dashboard?ref=friend").source).toBe("referral");
  });

  it("defaults to direct with no signal present", () => {
    expect(deriveAcquisitionSignal("/dashboard").source).toBe("direct");
    expect(deriveAcquisitionSignal(null).source).toBe("direct");
  });
});

describe("geo/countries — geography lookup", () => {
  it("recognizes a known country code", () => {
    expect(isKnownCountryCode("NG")).toBe(true);
    expect(isKnownCountryCode("zz")).toBe(false);
  });

  it("flags African countries correctly", () => {
    expect(isAfricanCountry("NG")).toBe(true);
    expect(isAfricanCountry("US")).toBe(false);
  });

  it("groups African sub-regions distinctly from the rest of the world", () => {
    const westAfrica = getCountryCodesForRegion("Western Africa");
    expect(westAfrica).toContain("NG");
    expect(westAfrica).not.toContain("US");
  });
});
