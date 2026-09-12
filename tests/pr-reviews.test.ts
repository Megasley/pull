import { describe, it, expect } from "vitest";

import { parsePrUrl } from "@/lib/pr-reviews/validate";
import { formatSubmittedByLabel } from "@/lib/pr-reviews/format";

describe("lib/pr-reviews/validate — parsePrUrl", () => {
  it("parses a standard GitHub PR URL", () => {
    expect(parsePrUrl("https://github.com/bitcoin/bitcoin/pull/12345")).toEqual({
      owner: "bitcoin",
      repo: "bitcoin",
      number: 12345,
      repoFullName: "bitcoin/bitcoin",
    });
  });

  it("accepts a www. prefix", () => {
    expect(parsePrUrl("https://www.github.com/lnbits/lnbits/pull/1")).toEqual({
      owner: "lnbits",
      repo: "lnbits",
      number: 1,
      repoFullName: "lnbits/lnbits",
    });
  });

  it("accepts a trailing slash", () => {
    expect(parsePrUrl("https://github.com/owner/repo/pull/42/")).toEqual({
      owner: "owner",
      repo: "repo",
      number: 42,
      repoFullName: "owner/repo",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parsePrUrl("  https://github.com/owner/repo/pull/42  ")).toEqual({
      owner: "owner",
      repo: "repo",
      number: 42,
      repoFullName: "owner/repo",
    });
  });

  it("rejects a non-GitHub URL", () => {
    expect(parsePrUrl("https://example.com/owner/repo/pull/1")).toBeNull();
  });

  it("rejects a GitHub URL that isn't a PR (e.g. an issue)", () => {
    expect(parsePrUrl("https://github.com/owner/repo/issues/1")).toBeNull();
  });

  it("rejects a repo URL with no PR number", () => {
    expect(parsePrUrl("https://github.com/owner/repo")).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(parsePrUrl("not a url")).toBeNull();
    expect(parsePrUrl("")).toBeNull();
  });

  it("rejects a PR number of zero", () => {
    expect(parsePrUrl("https://github.com/owner/repo/pull/0")).toBeNull();
  });
});

describe("lib/pr-reviews/format — formatSubmittedByLabel", () => {
  it("returns a generic admin label for admin-curated entries with a submitter", () => {
    expect(
      formatSubmittedByLabel({ sourceType: "admin_curated", submittedByUsername: "megasley" }),
    ).toBe("submitted by admin");
  });

  it("names the actual builder for peer submissions", () => {
    expect(
      formatSubmittedByLabel({ sourceType: "peer_submitted", submittedByUsername: "maxpax3" }),
    ).toBe("submitted by @maxpax3");
  });

  it("returns null when there's no submitter (pure auto-discovery)", () => {
    expect(
      formatSubmittedByLabel({ sourceType: "admin_curated", submittedByUsername: null }),
    ).toBeNull();
    expect(
      formatSubmittedByLabel({ sourceType: "peer_submitted", submittedByUsername: null }),
    ).toBeNull();
  });
});
