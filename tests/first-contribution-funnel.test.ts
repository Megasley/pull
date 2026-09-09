import { describe, expect, it } from "vitest";

import { conversionPct, durationMs } from "@/lib/first-contribution/funnel";

describe("first-contribution/funnel — conversionPct", () => {
  it("returns null when the denominator (reference stage) is empty", () => {
    expect(conversionPct(0, 0)).toBeNull();
  });

  it("computes a percentage to one decimal place", () => {
    expect(conversionPct(1, 3)).toBe(33.3);
  });

  it("returns 100 when every user at the reference stage converted", () => {
    expect(conversionPct(5, 5)).toBe(100);
  });
});

describe("first-contribution/funnel — durationMs", () => {
  it("returns null when the target timestamp is missing (still pending)", () => {
    expect(durationMs("2026-01-01T00:00:00.000Z", undefined)).toBeNull();
  });

  it("returns the millisecond gap for a normally ordered pair", () => {
    expect(durationMs("2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z")).toBe(
      24 * 60 * 60 * 1000,
    );
  });

  it("returns null for an out-of-order pair instead of a negative duration", () => {
    expect(durationMs("2026-01-02T00:00:00.000Z", "2026-01-01T00:00:00.000Z")).toBeNull();
  });
});
