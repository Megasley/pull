import { describe, expect, it } from "vitest";

import {
  classifyIssueFromLabels,
  parseIssueUrl,
  summarizeIssueBody,
} from "@/lib/issues/classify";

describe("lib/issues/classify — parseIssueUrl", () => {
  it("parses a standard issue URL", () => {
    expect(parseIssueUrl("https://github.com/lnbits/lnbits/issues/2650")).toEqual({
      owner: "lnbits",
      repo: "lnbits",
      number: 2650,
      repoFullName: "lnbits/lnbits",
    });
  });

  it("accepts a trailing slash and a #comment anchor", () => {
    expect(parseIssueUrl("https://github.com/a/b/issues/7/")?.number).toBe(7);
    expect(parseIssueUrl("https://github.com/a/b/issues/7#issuecomment-1")?.number).toBe(7);
  });

  it("rejects pull request and non-GitHub URLs", () => {
    expect(parseIssueUrl("https://github.com/a/b/pull/7")).toBeNull();
    expect(parseIssueUrl("https://gitlab.com/a/b/issues/7")).toBeNull();
    expect(parseIssueUrl("https://github.com/a/b/issues/0")).toBeNull();
  });
});

describe("lib/issues/classify — classifyIssueFromLabels", () => {
  it("maps good first issue to a beginner good-first-issue", () => {
    const result = classifyIssueFromLabels(["good first issue", "ui"], "TypeScript");
    expect(result.category).toBe("good_first_issue");
    expect(result.difficulty).toBe("beginner");
    expect(result.skills).toEqual(["typescript", "ui"]);
  });

  it("maps bug and enhancement labels", () => {
    expect(classifyIssueFromLabels(["type: bug"], null).category).toBe("bug_fix");
    expect(classifyIssueFromLabels(["enhancement"], null).category).toBe("feature_request");
    expect(classifyIssueFromLabels(["Documentation"], null)).toMatchObject({
      category: "documentation",
      difficulty: "beginner",
    });
  });

  it("defaults to help wanted / intermediate and honors difficulty labels", () => {
    expect(classifyIssueFromLabels([], null)).toMatchObject({
      category: "help_wanted",
      difficulty: "intermediate",
    });
    expect(classifyIssueFromLabels(["bug", "difficulty: hard"], null).difficulty).toBe(
      "advanced",
    );
  });

  it("turns area-style labels into skills and drops process labels", () => {
    const result = classifyIssueFromLabels(["area/wallet", "priority: high", "triage"], "Rust");
    expect(result.skills).toEqual(["rust", "wallet"]);
  });
});

describe("lib/issues/classify — summarizeIssueBody", () => {
  it("takes the first non-empty paragraph without markdown noise", () => {
    expect(
      summarizeIssueBody("<!-- template -->\n\n## Problem\n\nThe **fee** [chart](x) is off.", "t"),
    ).toBe("The fee chart is off.");
    expect(summarizeIssueBody("", "fallback")).toBe("fallback");
  });
});
