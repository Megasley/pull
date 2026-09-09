import { describe, expect, it } from "vitest";

import { deriveStepCompletionEvents } from "@/lib/first-contribution/analytics";
import {
  deriveFirstContributionProgress,
  type FirstContributionProgress,
  type FirstContributionProgressRow,
} from "@/lib/first-contribution/progress";
import { firstContributionSteps, getFirstContributionStep } from "@/lib/first-contribution/steps";

function row(overrides: Partial<FirstContributionProgressRow> = {}): FirstContributionProgressRow {
  return {
    nodeSlug: "understand-open-source",
    status: "completed",
    completedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("deriveFirstContributionProgress", () => {
  it("starting progress: no rows means nothing started", () => {
    const progress = deriveFirstContributionProgress([]);

    expect(progress).toEqual({
      completedSlugs: [],
      startedAt: null,
      completedAt: null,
      isComplete: false,
    });
  });

  it("completing a step: one completed row is reflected, journey stays incomplete", () => {
    const progress = deriveFirstContributionProgress([
      row({ nodeSlug: "understand-open-source", createdAt: "2026-01-01T00:00:00.000Z" }),
    ]);

    expect(progress.completedSlugs).toEqual(["understand-open-source"]);
    expect(progress.startedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(progress.isComplete).toBe(false);
    expect(progress.completedAt).toBeNull();
  });

  it("resuming progress: returns every completed step across separate sessions", () => {
    const rows = [
      row({
        nodeSlug: "understand-open-source",
        createdAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-01T00:00:00.000Z",
      }),
      row({
        nodeSlug: "set-up-your-tools",
        createdAt: "2026-01-03T00:00:00.000Z",
        completedAt: "2026-01-03T00:00:00.000Z",
      }),
    ];

    const progress = deriveFirstContributionProgress(rows);

    expect(progress.completedSlugs).toEqual(["understand-open-source", "set-up-your-tools"]);
    // Started reflects the earliest row, not the most recent session.
    expect(progress.startedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("duplicate completion: repeated rows for the same step don't double-count", () => {
    const rows = [
      row({ nodeSlug: "understand-open-source" }),
      row({ nodeSlug: "understand-open-source", completedAt: "2026-01-02T00:00:00.000Z" }),
    ];

    const progress = deriveFirstContributionProgress(rows);

    expect(progress.completedSlugs).toEqual(["understand-open-source"]);
  });

  it("ignores rows for step slugs that no longer exist in the journey", () => {
    const progress = deriveFirstContributionProgress([row({ nodeSlug: "not-a-real-step" })]);

    expect(progress.completedSlugs).toEqual([]);
  });

  it("marks the journey complete only once every step is completed, using the latest completedAt", () => {
    const rows = firstContributionSteps.map((step, index) =>
      row({
        nodeSlug: step.slug,
        createdAt: `2026-01-0${(index % 9) + 1}T00:00:00.000Z`,
        completedAt: `2026-02-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );

    const progress = deriveFirstContributionProgress(rows);

    expect(progress.isComplete).toBe(true);
    expect(progress.completedSlugs).toHaveLength(firstContributionSteps.length);
    expect(progress.completedAt).toBe(
      `2026-02-${String(firstContributionSteps.length).padStart(2, "0")}T00:00:00.000Z`,
    );
  });

  it("does not mark the journey complete when a step is only in_progress", () => {
    const rows = firstContributionSteps.map((step) =>
      row({ nodeSlug: step.slug, status: step.slug === "real-project" ? "in_progress" : "completed" }),
    );

    const progress = deriveFirstContributionProgress(rows);

    expect(progress.isComplete).toBe(false);
    expect(progress.completedSlugs).not.toContain("real-project");
  });
});

function progress(overrides: Partial<FirstContributionProgress> = {}): FirstContributionProgress {
  return {
    completedSlugs: [],
    startedAt: null,
    completedAt: null,
    isComplete: false,
    ...overrides,
  };
}

describe("analytics — deriveStepCompletionEvents", () => {
  it("duplicate completion: fires nothing when the step was already completed", () => {
    const before = progress({ completedSlugs: ["understand-open-source"], startedAt: "2026-01-01" });

    expect(deriveStepCompletionEvents(before, before, false)).toEqual([]);
  });

  it("first ever step: fires started, then step completed", () => {
    const before = progress();
    const after = progress({ completedSlugs: ["understand-open-source"], startedAt: "2026-01-01" });

    expect(deriveStepCompletionEvents(before, after, true)).toEqual([
      "first_contribution_started",
      "first_contribution_step_completed",
    ]);
  });

  it("a later step: fires step completed only, journey already started", () => {
    const before = progress({ completedSlugs: ["understand-open-source"], startedAt: "2026-01-01" });
    const after = progress({
      completedSlugs: ["understand-open-source", "set-up-your-tools"],
      startedAt: "2026-01-01",
    });

    expect(deriveStepCompletionEvents(before, after, true)).toEqual([
      "first_contribution_step_completed",
    ]);
  });

  it("final step: fires step completed and journey completed together", () => {
    const before = progress({
      completedSlugs: firstContributionSteps.slice(0, -1).map((step) => step.slug),
      startedAt: "2026-01-01",
    });
    const after = progress({
      completedSlugs: firstContributionSteps.map((step) => step.slug),
      startedAt: "2026-01-01",
      isComplete: true,
      completedAt: "2026-02-01",
    });

    expect(deriveStepCompletionEvents(before, after, true)).toEqual([
      "first_contribution_step_completed",
      "first_contribution_completed",
    ]);
  });
});

describe("getFirstContributionStep", () => {
  it("returns undefined for an unknown slug (guards unauthenticated/invalid action calls)", () => {
    expect(getFirstContributionStep("not-a-real-step")).toBeUndefined();
  });

  it("returns the step for a known slug", () => {
    expect(getFirstContributionStep("understand-open-source")?.order).toBe(1);
  });
});
