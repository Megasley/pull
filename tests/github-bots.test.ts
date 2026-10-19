import { describe, expect, it } from "vitest";

import { isBotAccount } from "@/lib/github/bots";

describe("lib/github/bots — isBotAccount", () => {
  it("treats GitHub App logins and Bot-typed accounts as bots", () => {
    expect(isBotAccount("dependabot[bot]")).toBe(true);
    expect(isBotAccount("Renovate[bot]")).toBe(true);
    expect(isBotAccount("github-actions[bot]")).toBe(true);
    expect(isBotAccount("some-ci-app", "Bot")).toBe(true);
  });

  it("matches older bots that use plain user accounts", () => {
    expect(isBotAccount("renovate-bot")).toBe(true);
    expect(isBotAccount("DependaBot")).toBe(true);
  });

  it("leaves people alone, including names that merely contain 'bot'", () => {
    expect(isBotAccount("achow101")).toBe(false);
    expect(isBotAccount("robot-lover", "User")).toBe(false);
    expect(isBotAccount("botanist")).toBe(false);
    expect(isBotAccount("")).toBe(false);
    expect(isBotAccount(null)).toBe(false);
  });
});
