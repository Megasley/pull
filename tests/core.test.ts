import { describe, it, expect } from "vitest";

import {
  saturate,
  clampScore,
  strengthFromNormalized,
  buildScoreSummary,
} from "@/lib/scoring/normalize";

import { calculateReputation } from "@/lib/reputation/calculate";
import { REPUTATION_TARGETS, REPUTATION_WEIGHTS } from "@/lib/reputation/weights";
import type { ReputationInputs } from "@/types/reputation";

import { calculateBuilderScore } from "@/lib/score/calculate";
import { BUILDER_SCORE_TARGETS, BUILDER_SCORE_WEIGHTS } from "@/lib/score/weights";
import type { BuilderScoreInputs } from "@/types/score";

import { levelFromXp, buildLevelInfo } from "@/lib/xp/levels";

import {
  sanitizeRedirectPath,
  isProtectedRoute,
  protectedRoutes,
} from "@/lib/auth/routes";

import {
  validateSubmissionInput,
  MAX_SCREENSHOTS,
  MAX_URL_LENGTH,
} from "@/lib/submissions/validate";

import { validateProfileEditInput } from "@/lib/profile/validate";

import {
  isEligiblePeer,
  getRequiredApprovals,
  getClaimMinutes,
  getReputationThreshold,
  claimExpiresAtIso,
  isClaimActive,
  type PeerReviewContext,
} from "@/lib/reviews/community";

describe("lib/scoring/normalize", () => {
  it("saturate returns 0 for non-positive inputs", () => {
    expect(saturate(0, 10)).toBe(0);
    expect(saturate(-5, 10)).toBe(0);
    expect(saturate(10, 0)).toBe(0);
    expect(saturate(10, -3)).toBe(0);
  });

  it("saturate grows monotonically and asymptotes below 1", () => {
    const target = 10;
    const v1 = saturate(target / 2, target);
    const v2 = saturate(target, target);
    const v3 = saturate(target * 5, target);
    const v4 = saturate(target * 1000, target);
    expect(v1).toBeGreaterThan(0);
    expect(v2).toBeGreaterThan(v1);
    expect(v3).toBeGreaterThan(v2);
    expect(v4).toBeGreaterThan(v3);
    expect(v4).toBeLessThan(1.15);
  });

  it("saturate accepts custom coefficient", () => {
    const a = saturate(10, 10, 0.5);
    const b = saturate(10, 10, 2);
    expect(b).toBeGreaterThan(a);
  });

  it("clampScore clamps to [0, 100] integers", () => {
    expect(clampScore(-1)).toBe(0);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(50.4)).toBe(50);
    expect(clampScore(50.6)).toBe(51);
    expect(clampScore(100)).toBe(100);
    expect(clampScore(200)).toBe(100);
  });

  it("strengthFromNormalized returns correct bands", () => {
    expect(strengthFromNormalized(0)).toBe("emerging");
    expect(strengthFromNormalized(0.24)).toBe("emerging");
    expect(strengthFromNormalized(0.25)).toBe("building");
    expect(strengthFromNormalized(0.54)).toBe("building");
    expect(strengthFromNormalized(0.55)).toBe("strong");
    expect(strengthFromNormalized(0.84)).toBe("strong");
    expect(strengthFromNormalized(0.85)).toBe("exceptional");
    expect(strengthFromNormalized(1)).toBe("exceptional");
  });

  it("buildScoreSummary uses correct band templates", () => {
    const templates = {
      zero: "z",
      early: (t: string) => `e:${t}`,
      solid: (t: string) => `s:${t}`,
      meaningful: (t: string) => `m:${t}`,
      high: (t: string) => `h:${t}`,
    };
    const factors = [{ label: "L", strengthPercent: 80 }];
    expect(buildScoreSummary(0, factors, templates)).toBe("z");
    expect(buildScoreSummary(24, factors, templates)).toMatch(/^e:/);
    expect(buildScoreSummary(49, factors, templates)).toMatch(/^s:/);
    expect(buildScoreSummary(74, factors, templates)).toMatch(/^m:/);
    expect(buildScoreSummary(100, factors, templates)).toMatch(/^h:/);
  });

  it("buildScoreSummary picks the top-strength factor", () => {
    const templates = {
      zero: "z",
      early: (t: string) => `early:${t}`,
      solid: (t: string) => `solid:${t}`,
      meaningful: (t: string) => `meaningful:${t}`,
      high: (t: string) => `high:${t}`,
    };
    const factors = [
      { label: "Weak", strengthPercent: 20 },
      { label: "Top", strengthPercent: 90 },
      { label: "Mid", strengthPercent: 50 },
    ];
    expect(buildScoreSummary(24, factors, templates)).toBe("early:Top");
  });
});

describe("lib/reputation/calculate — numeric invariants", () => {
  const EMPTY: ReputationInputs = {
    mergedPullRequests: 0,
    maintainerReviewComments: 0,
    activeMonths: 0,
    uniqueRepos: 0,
    documentationContributions: 0,
    issueDiscussions: 0,
    codeReviews: 0,
  };

  it("score for empty inputs is exactly 0", () => {
    const r = calculateReputation(EMPTY, { monthly: [], milestones: [] });
    expect(r.score).toBe(0);
    expect(r.factors.every((f) => f.raw === 0)).toBe(true);
  });

  it("score is always integer within [0, 100]", () => {
    for (let i = 0; i < 25; i += 1) {
      const multiplier = 0.1 + i * 0.6;
      const inputs: ReputationInputs = {
        mergedPullRequests: Math.round(
          (REPUTATION_TARGETS.merged_pull_requests ?? 10) * multiplier,
        ),
        maintainerReviewComments: Math.round(
          (REPUTATION_TARGETS.maintainer_reviews ?? 10) * multiplier,
        ),
        activeMonths: Math.round(
          (REPUTATION_TARGETS.contribution_frequency ?? 6) * multiplier,
        ),
        uniqueRepos: Math.round(
          (REPUTATION_TARGETS.repository_diversity ?? 5) * multiplier,
        ),
        documentationContributions: Math.round(
          (REPUTATION_TARGETS.documentation_contributions ?? 5) * multiplier,
        ),
        issueDiscussions: Math.round(
          (REPUTATION_TARGETS.issue_discussions ?? 5) * multiplier,
        ),
        codeReviews: Math.round((REPUTATION_TARGETS.code_reviews ?? 5) * multiplier),
      };
      const { score, factors } = calculateReputation(inputs, {
        monthly: [],
        milestones: [],
      });
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      for (const factor of factors) {
        expect(factor.strengthPercent).toBeGreaterThanOrEqual(0);
        expect(factor.strengthPercent).toBeLessThanOrEqual(100);
      }
    }
  });

  it("weighted score equals sum of weights * factor strength/100", () => {
    const inputs: ReputationInputs = {
      mergedPullRequests: 4,
      maintainerReviewComments: 10,
      activeMonths: 6,
      uniqueRepos: 3,
      documentationContributions: 5,
      issueDiscussions: 8,
      codeReviews: 12,
    };
    const { score, factors } = calculateReputation(inputs, {
      monthly: [],
      milestones: [],
    });
    const expectedRaw = factors.reduce(
      (sum, f) => sum + REPUTATION_WEIGHTS[f.id] * (f.strengthPercent / 100),
      0,
    );
    expect(score).toBe(Math.max(0, Math.min(100, Math.round(expectedRaw))));
  });

  it("summary is non-empty string", () => {
    const r = calculateReputation(EMPTY, { monthly: [], milestones: [] });
    expect(typeof r.summary).toBe("string");
    expect(r.summary.length).toBeGreaterThan(0);
  });
});

describe("lib/score/calculate — numeric invariants", () => {
  const EMPTY: BuilderScoreInputs = {
    projectsCompleted: 0,
    projectsApproved: 0,
    roadmapsCompleted: 0,
    openSourceContributions: 0,
    communityReviews: 0,
    activeWeeks: 0,
  };

  it("score for empty inputs is exactly 0", () => {
    const r = calculateBuilderScore(EMPTY);
    expect(r.score).toBe(0);
    expect(r.summary.length).toBeGreaterThan(0);
  });

  it("score is always integer within [0, 100]", () => {
    for (let i = 0; i < 20; i += 1) {
      const m = 0.1 + i * 0.5;
      const inputs: BuilderScoreInputs = {
        projectsCompleted: Math.round(
          (BUILDER_SCORE_TARGETS.projects_completed ?? 5) * m,
        ),
        projectsApproved: Math.round(
          (BUILDER_SCORE_TARGETS.projects_approved ?? 5) * m,
        ),
        roadmapsCompleted: Math.round(
          (BUILDER_SCORE_TARGETS.roadmaps_completed ?? 2) * m,
        ),
        openSourceContributions: Math.round(
          (BUILDER_SCORE_TARGETS.open_source_contributions ?? 5) * m,
        ),
        communityReviews: Math.round(
          (BUILDER_SCORE_TARGETS.community_reviews ?? 5) * m,
        ),
        activeWeeks: Math.round(
          (BUILDER_SCORE_TARGETS.contribution_consistency ?? 12) * m,
        ),
      };
      const { score, factors } = calculateBuilderScore(inputs);
      expect(Number.isInteger(score)).toBe(true);
      expect(score >= 0 && score <= 100).toBe(true);
      for (const f of factors) {
        expect(f.strengthPercent >= 0 && f.strengthPercent <= 100).toBe(true);
      }
    }
  });

  it("weighted score equals sum of weights * strengthPercent/100", () => {
    const inputs: BuilderScoreInputs = {
      projectsCompleted: 3,
      projectsApproved: 2,
      roadmapsCompleted: 1,
      openSourceContributions: 4,
      communityReviews: 5,
      activeWeeks: 20,
    };
    const { score, factors } = calculateBuilderScore(inputs);
    const raw = factors.reduce(
      (s, f) => s + BUILDER_SCORE_WEIGHTS[f.id] * (f.strengthPercent / 100),
      0,
    );
    expect(score).toBe(Math.max(0, Math.min(100, Math.round(raw))));
  });
});

describe("lib/xp/levels", () => {
  it("levelFromXp: 0 xp → level 1", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-10)).toBe(1);
  });

  it("levelFromXp: exactly XP_PER_LEVEL boundaries", () => {
    expect(levelFromXp(249)).toBe(1);
    expect(levelFromXp(250)).toBe(2);
    expect(levelFromXp(499)).toBe(2);
    expect(levelFromXp(500)).toBe(3);
    expect(levelFromXp(1000)).toBe(5);
  });

  it("buildLevelInfo: progress percentage at 0 xp → 0%", () => {
    const info = buildLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.xp).toBe(0);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.progressPercentage).toBe(0);
    expect(info.xpForNextLevel).toBe(250);
  });

  it("buildLevelInfo: halfway through level 1 → 50%", () => {
    const info = buildLevelInfo(125);
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(125);
    expect(info.progressPercentage).toBe(50);
  });

  it("buildLevelInfo: exactly at boundary → 0% of next level", () => {
    const info = buildLevelInfo(250);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.progressPercentage).toBe(0);
  });

  it("buildLevelInfo overrides level if provided", () => {
    const info = buildLevelInfo(125, 99);
    expect(info.level).toBe(99);
    expect(info.progressPercentage).toBe(50);
  });
});

describe("lib/auth/routes — sanitizeRedirectPath", () => {
  it("returns /dashboard for null/undefined/empty", () => {
    expect(sanitizeRedirectPath(null)).toBe("/dashboard");
    expect(sanitizeRedirectPath(undefined)).toBe("/dashboard");
    expect(sanitizeRedirectPath("")).toBe("/dashboard");
    expect(sanitizeRedirectPath("   ")).toBe("/dashboard");
  });

  it("blocks paths not starting with /", () => {
    expect(sanitizeRedirectPath("dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("http://evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("blocks protocol-relative //evil.com", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.com/x")).toBe("/dashboard");
    expect(sanitizeRedirectPath("///evil.com")).toBe("/dashboard");
  });

  it("blocks backslash-based open redirect tricks", () => {
    expect(sanitizeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/\\\\evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/\\/evil.com")).toBe("/dashboard");
  });

  it("blocks dot-segment path traversal", () => {
    expect(sanitizeRedirectPath("/../etc/passwd")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/a/..")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/a/./b")).toBe("/dashboard");
  });

  it("allows and preserves normal internal paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/roadmaps/bitcoin")).toBe("/roadmaps/bitcoin");
    expect(sanitizeRedirectPath("/projects/hello-regtest/submit")).toBe(
      "/projects/hello-regtest/submit",
    );
    expect(sanitizeRedirectPath("/u/satoshi")).toBe("/u/satoshi");
  });

  it("preserves query string and hash for valid paths", () => {
    expect(sanitizeRedirectPath("/roadmaps/b?tab=1")).toBe("/roadmaps/b?tab=1");
    expect(sanitizeRedirectPath("/a#top")).toBe("/a#top");
  });

  it("strips trailing slashes consistently so /dashboard and /dashboard/ are equivalent", () => {
    const r1 = sanitizeRedirectPath("/dashboard");
    const r2 = sanitizeRedirectPath("/dashboard/");
    expect(r1).toBe("/dashboard");
    expect(r2).toBe("/dashboard");
    expect(r1).toBe(r2);
  });
});

describe("lib/auth/routes — isProtectedRoute matches every protectedRoutes tuple entry", () => {
  it("sign-in page is auth middleware route but not protected", () => {
    expect(isProtectedRoute("/sign-in")).toBe(false);
  });

  it.each([
    "/start",
    "/onboarding",
    "/dashboard",
    "/achievements",
    "/settings",
    "/repositories",
    "/activity",
    "/portfolio",
    "/reputation",
    "/review",
    "/admin",
  ])("exact protected route %s is detected", (route) => {
    expect(isProtectedRoute(route)).toBe(true);
  });

  it.each([
    ["/start/something", true],
    ["/onboarding/2", true],
    ["/dashboard/overview", true],
    ["/review/abc-123", true],
    ["/admin/users/uuid", true],
    ["/settings/github", true],
    ["/roadmaps/bitcoin", false],
    ["/builders", false],
    ["/projects/spec", false],
    ["/", false],
    ["/sign-in", false],
  ])("path %s isProtectedRoute=%s", (path, expected) => {
    expect(isProtectedRoute(path)).toBe(expected);
  });

  it("wildcard /projects/*/submit pattern matches", () => {
    expect(isProtectedRoute("/projects/hello-regtest/submit")).toBe(true);
    expect(isProtectedRoute("/projects/bolt11-decoder/submit")).toBe(true);
    expect(isProtectedRoute("/projects/some-project/submit/")).toBe(true);
    expect(isProtectedRoute("/projects")).toBe(false);
    expect(isProtectedRoute("/projects/some-project")).toBe(false);
    expect(isProtectedRoute("/projects/a/b/submit")).toBe(false);
  });

  it("protectedRoutes tuple has no stray entries — each exact route pattern is detected", () => {
    for (const pattern of protectedRoutes) {
      if (pattern.includes("*")) {
        const sample = pattern.replace("*", "sample-slug");
        expect(isProtectedRoute(sample)).toBe(true);
      } else {
        expect(isProtectedRoute(pattern)).toBe(true);
      }
    }
  });
});

describe("lib/submissions/validate", () => {
  const VALID_BASE = {
    repoUrl: "https://github.com/satoshi/hello-regtest",
    prUrl: "",
    liveDemoUrl: "",
    videoDemoUrl: "",
    screenshotUrls: "",
    notes: "",
  };

  it("accepts a minimal valid submission with requireRepo=true", () => {
    const r = validateSubmissionInput(VALID_BASE, { requireRepo: true });
    expect(r.ok).toBe(true);
  });

  it("rejects when requireRepo=true and repoUrl is missing", () => {
    const r = validateSubmissionInput(
      { ...VALID_BASE, repoUrl: "" },
      { requireRepo: true },
    );
    expect(r.ok).toBe(false);
  });

  it("rejects invalid GitHub repo URL", () => {
    const r = validateSubmissionInput(
      { ...VALID_BASE, repoUrl: "https://gitlab.com/a/b" },
      { requireRepo: true },
    );
    expect(r.ok).toBe(false);
  });

  it("rejects invalid PR URL", () => {
    const r = validateSubmissionInput(
      { ...VALID_BASE, prUrl: "https://github.com/a/b" },
      { requireRepo: true },
    );
    expect(r.ok).toBe(false);
  });

  it("rejects non-http screenshot URLs", () => {
    const r = validateSubmissionInput(
      { ...VALID_BASE, screenshotUrls: "ftp://bad.com/a.png" },
      { requireRepo: false },
    );
    expect(r.ok).toBe(false);
  });

  it(`rejects more than ${MAX_SCREENSHOTS} screenshots`, () => {
    const urls = Array.from({ length: MAX_SCREENSHOTS + 2 }, (_, i) =>
      i === 0 ? "https://a.com/1.png" : `https://a.com/${i}.png`,
    ).join("\n");
    const r = validateSubmissionInput(
      { ...VALID_BASE, screenshotUrls: urls },
      { requireRepo: false },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Too many screenshots/);
  });

  it(`rejects URL longer than ${MAX_URL_LENGTH}`, () => {
    const longUrl = "https://example.com/" + "a".repeat(MAX_URL_LENGTH);
    const r = validateSubmissionInput(
      { ...VALID_BASE, screenshotUrls: longUrl },
      { requireRepo: false },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/exceeds/);
  });

  it("rejects notes longer than 5000 chars", () => {
    const r = validateSubmissionInput(
      { ...VALID_BASE, notes: "x".repeat(5001) },
      { requireRepo: false },
    );
    expect(r.ok).toBe(false);
  });

  it("parses valid multi-line screenshot URLs with dedup", () => {
    const r = validateSubmissionInput(
      {
        ...VALID_BASE,
        screenshotUrls:
          "https://a.com/1.png\nhttps://a.com/1.png/\nhttps://a.com/2.png",
      },
      { requireRepo: false },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.screenshotUrls).toHaveLength(2);
  });
});

describe("lib/profile/validate", () => {
  const BASE = {
    displayName: "Satoshi Nakamoto",
    bio: "Building things.",
    website: "",
    twitterUrl: "",
    linkedinUrl: "",
    skills: "Bitcoin, Lightning",
    lookingFor: [],
    profilePublic: "on",
    listedInDirectory: "on",
  };

  it("accepts valid profile edit input", () => {
    const r = validateProfileEditInput(BASE);
    expect(r.ok).toBe(true);
  });

  it("rejects displayName < 2 or > 80", () => {
    expect(validateProfileEditInput({ ...BASE, displayName: "A" }).ok).toBe(false);
    expect(validateProfileEditInput({ ...BASE, displayName: "" }).ok).toBe(false);
    expect(validateProfileEditInput({ ...BASE, displayName: "A".repeat(81) }).ok).toBe(
      false,
    );
  });

  it("rejects bio > 500 chars", () => {
    expect(validateProfileEditInput({ ...BASE, bio: "x".repeat(501) }).ok).toBe(false);
  });

  it("rejects invalid http URLs for website/twitter/linkedin", () => {
    expect(validateProfileEditInput({ ...BASE, website: "ftp://x.y" }).ok).toBe(false);
    expect(validateProfileEditInput({ ...BASE, twitterUrl: "not a url" }).ok).toBe(
      false,
    );
  });

  it("force-lists listedInDirectory=false when profilePublic=false", () => {
    const r = validateProfileEditInput({
      ...BASE,
      profilePublic: null,
      listedInDirectory: "on",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.profilePublic).toBe(false);
      expect(r.data.listedInDirectory).toBe(false);
    }
  });
});

describe("lib/reviews/community", () => {
  function ctx(partial: Partial<PeerReviewContext> = {}): PeerReviewContext {
    return {
      userId: "reviewer-1",
      role: "builder",
      isStaff: false,
      reputation: 0,
      approvedProjectIds: new Set<string>(),
      ...partial,
    };
  }

  it("getRequiredApprovals/getClaimMinutes/getReputationThreshold return positive numbers", () => {
    expect(getRequiredApprovals()).toBeGreaterThanOrEqual(1);
    expect(getClaimMinutes()).toBeGreaterThanOrEqual(5);
    expect(getReputationThreshold()).toBeGreaterThanOrEqual(0);
  });

  it("isClaimActive returns false with missing fields", () => {
    expect(isClaimActive({ claimedBy: null, claimExpiresAt: null })).toBe(false);
    expect(isClaimActive({ claimedBy: "u1", claimExpiresAt: null })).toBe(false);
    expect(
      isClaimActive({ claimedBy: null, claimExpiresAt: "2099-01-01T00:00:00Z" }),
    ).toBe(false);
  });

  it("isClaimActive: future expiry → active; past expiry → inactive", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isClaimActive({ claimedBy: "u", claimExpiresAt: future })).toBe(true);
    expect(isClaimActive({ claimedBy: "u", claimExpiresAt: past })).toBe(false);
    const pinnedNow = new Date();
    const justAfter = new Date(pinnedNow.getTime() + 1000);
    expect(
      isClaimActive({
        claimedBy: "u",
        claimExpiresAt: justAfter.toISOString(),
        now: pinnedNow,
      }),
    ).toBe(true);
  });

  it("claimExpiresAtIso is in the future by >= claim minutes - 1 second margin", () => {
    const from = new Date();
    const expires = new Date(claimExpiresAtIso(from));
    const minutes = getClaimMinutes();
    const diffMs = expires.getTime() - from.getTime();
    expect(diffMs).toBeGreaterThanOrEqual((minutes - 1) * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual((minutes + 1) * 60 * 1000);
  });

  it("isEligiblePeer blocks reviewing own submission", () => {
    const peerCtx = ctx({ userId: "same-user" });
    expect(isEligiblePeer(peerCtx, { userId: "same-user", projectId: "p" })).toBe(
      false,
    );
  });

  it("isEligiblePeer: staff reviewers are always eligible", () => {
    const staffCtx = ctx({ role: "reviewer", isStaff: true, reputation: 0 });
    expect(isEligiblePeer(staffCtx, { userId: "submitter", projectId: "p" })).toBe(
      true,
    );
  });

  it("isEligiblePeer: non-staff user who completed same project is eligible", () => {
    const peerCtx = ctx({ approvedProjectIds: new Set(["p1"]) });
    expect(isEligiblePeer(peerCtx, { userId: "u", projectId: "p1" })).toBe(true);
    expect(isEligiblePeer(peerCtx, { userId: "u", projectId: "p2" })).toBe(false);
  });

  it("isEligiblePeer: reputation threshold gating", () => {
    const threshold = getReputationThreshold();
    const below = ctx({ reputation: Math.max(0, threshold - 1) });
    const at = ctx({ reputation: threshold });
    const above = ctx({ reputation: threshold + 100 });
    expect(isEligiblePeer(below, { userId: "u", projectId: "new" })).toBe(false);
    expect(isEligiblePeer(at, { userId: "u", projectId: "new" })).toBe(true);
    expect(isEligiblePeer(above, { userId: "u", projectId: "new" })).toBe(true);
  });
});
