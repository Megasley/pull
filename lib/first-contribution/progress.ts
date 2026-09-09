import { and, eq } from "drizzle-orm";

import { getDb, isDbConnectionError, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { userRoadmapProgress } from "@/lib/db/schema";

import { FIRST_CONTRIBUTION_ROADMAP_SLUG, firstContributionSteps } from "./steps";

export { FIRST_CONTRIBUTION_ROADMAP_SLUG };

/** Reuses the existing generic `userRoadmapProgress` table (userId, roadmapSlug,
 *  nodeSlug) rather than a dedicated table — it already has the unique
 *  constraint and status/timestamp columns this feature needs. */
const ALL_STEP_SLUGS = new Set(firstContributionSteps.map((step) => step.slug));
const TOTAL_STEPS = firstContributionSteps.length;

export type FirstContributionProgressRow = {
  nodeSlug: string;
  status: "not_started" | "in_progress" | "completed";
  completedAt: string | null;
  createdAt: string;
};

export type FirstContributionProgress = {
  completedSlugs: string[];
  /** Earliest row for this user/roadmap — a proxy for "journey started".
   *  There's no separate "start" event; the first completed step marks it. */
  startedAt: string | null;
  /** Set only once every step is completed. */
  completedAt: string | null;
  isComplete: boolean;
};

const EMPTY_PROGRESS: FirstContributionProgress = {
  completedSlugs: [],
  startedAt: null,
  completedAt: null,
  isComplete: false,
};

/** Pure — derives journey-level progress from raw per-node rows so this logic
 *  is unit-testable without a database. See tests/first-contribution.test.ts. */
export function deriveFirstContributionProgress(
  rows: readonly FirstContributionProgressRow[],
): FirstContributionProgress {
  if (rows.length === 0) {
    return EMPTY_PROGRESS;
  }

  const completedSlugs = [
    ...new Set(
      rows
        .filter((row) => row.status === "completed" && ALL_STEP_SLUGS.has(row.nodeSlug))
        .map((row) => row.nodeSlug),
    ),
  ];

  const startedAt = rows.reduce<string | null>(
    (earliest, row) => (!earliest || row.createdAt < earliest ? row.createdAt : earliest),
    null,
  );

  const isComplete = completedSlugs.length === TOTAL_STEPS;

  const completedAt = isComplete
    ? rows.reduce<string | null>((latest, row) => {
        if (row.status !== "completed" || !row.completedAt) return latest;
        return !latest || row.completedAt > latest ? row.completedAt : latest;
      }, null)
    : null;

  return { completedSlugs, startedAt, completedAt, isComplete };
}

export async function getFirstContributionProgress(
  userId: string,
): Promise<FirstContributionProgress> {
  if (!isDatabaseConfigured()) {
    return EMPTY_PROGRESS;
  }

  try {
    return await withDbRetry(async () => {
      const db = getDb();
      const rows = await db
        .select({
          nodeSlug: userRoadmapProgress.nodeSlug,
          status: userRoadmapProgress.status,
          completedAt: userRoadmapProgress.completedAt,
          createdAt: userRoadmapProgress.createdAt,
        })
        .from(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.userId, userId),
            eq(userRoadmapProgress.roadmapSlug, FIRST_CONTRIBUTION_ROADMAP_SLUG),
          ),
        );

      return deriveFirstContributionProgress(rows);
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[first-contribution] getFirstContributionProgress unavailable", error);
      return EMPTY_PROGRESS;
    }
    throw error;
  }
}

/** Throws for an unknown step slug — callers (the server action) should
 *  validate against `getFirstContributionStep` first for a friendlier error. */
export async function setFirstContributionStepCompletion(
  userId: string,
  stepSlug: string,
  completed: boolean,
): Promise<void> {
  if (!ALL_STEP_SLUGS.has(stepSlug)) {
    throw new Error(`Unknown First Contribution step: ${stepSlug}`);
  }

  if (!isDatabaseConfigured()) {
    return;
  }

  await withDbRetry(async () => {
    const db = getDb();

    if (!completed) {
      await db
        .delete(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.userId, userId),
            eq(userRoadmapProgress.roadmapSlug, FIRST_CONTRIBUTION_ROADMAP_SLUG),
            eq(userRoadmapProgress.nodeSlug, stepSlug),
          ),
        );
      return;
    }

    const timestamp = new Date().toISOString();

    // onConflictDoUpdate against the table's existing unique(userId, roadmapSlug,
    // nodeSlug) index — the same constraint every other roadmap already relies
    // on — makes this idempotent: completing a step twice updates one row.
    await db
      .insert(userRoadmapProgress)
      .values({
        userId,
        roadmapSlug: FIRST_CONTRIBUTION_ROADMAP_SLUG,
        nodeSlug: stepSlug,
        status: "completed",
        completedAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: [
          userRoadmapProgress.userId,
          userRoadmapProgress.roadmapSlug,
          userRoadmapProgress.nodeSlug,
        ],
        set: {
          status: "completed",
          completedAt: timestamp,
          updatedAt: timestamp,
        },
      });
  });
}
