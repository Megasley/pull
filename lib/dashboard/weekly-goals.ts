import { and, eq, gte } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  githubPullRequests,
  userRoadmapProgress,
  userWeeklyGoals,
} from "@/lib/db/schema";
import type { WeeklyGoalItem } from "@/types/dashboard";

function isoWeekStart(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay() || 7;
  if (day !== 1) {
    d.setUTCDate(d.getUTCDate() - (day - 1));
  }
  return d.toISOString().slice(0, 10);
}

const DEFAULT_GOALS: Array<{
  title: string;
  targetType: WeeklyGoalItem["targetType"];
  targetCount: number;
}> = [
  {
    title: "Open 1 pull request",
    targetType: "open_pr",
    targetCount: 1,
  },
  {
    title: "Complete 1 lesson",
    targetType: "complete_lesson",
    targetCount: 1,
  },
  {
    title: "Browse Open Source Projects for a contribution",
    targetType: "custom",
    targetCount: 1,
  },
];

function mapGoal(row: typeof userWeeklyGoals.$inferSelect): WeeklyGoalItem {
  return {
    id: row.id,
    title: row.title,
    targetType: row.targetType,
    targetCount: row.targetCount,
    progressCount: row.progressCount,
    weekStart: row.weekStart,
  };
}

async function computeAutoProgress(
  userId: string,
  weekStart: string,
  targetType: WeeklyGoalItem["targetType"],
): Promise<number | null> {
  if (!isDatabaseConfigured()) return null;
  if (targetType === "custom") return null;

  const db = getDb();
  const weekStartIso = `${weekStart}T00:00:00.000Z`;

  if (targetType === "open_pr") {
    const rows = await db
      .select({ id: githubPullRequests.id })
      .from(githubPullRequests)
      .where(
        and(
          eq(githubPullRequests.userId, userId),
          gte(githubPullRequests.githubCreatedAt, weekStartIso),
        ),
      );
    return rows.length;
  }

  if (targetType === "merge_pr") {
    const rows = await db
      .select({ id: githubPullRequests.id })
      .from(githubPullRequests)
      .where(
        and(
          eq(githubPullRequests.userId, userId),
          eq(githubPullRequests.merged, true),
          gte(githubPullRequests.githubMergedAt, weekStartIso),
        ),
      );
    return rows.length;
  }

  if (targetType === "complete_lesson") {
    const rows = await db
      .select({ id: userRoadmapProgress.id })
      .from(userRoadmapProgress)
      .where(
        and(
          eq(userRoadmapProgress.userId, userId),
          eq(userRoadmapProgress.status, "completed"),
          gte(userRoadmapProgress.completedAt, weekStartIso),
        ),
      );
    return rows.length;
  }

  return null;
}

export async function ensureWeeklyGoals(userId: string): Promise<WeeklyGoalItem[]> {
  if (!isDatabaseConfigured()) return [];

  const db = getDb();
  const weekStart = isoWeekStart();
  const existing = await db
    .select()
    .from(userWeeklyGoals)
    .where(
      and(eq(userWeeklyGoals.userId, userId), eq(userWeeklyGoals.weekStart, weekStart)),
    );

  if (existing.length === 0) {
    const stamp = new Date().toISOString();
    await db.insert(userWeeklyGoals).values(
      DEFAULT_GOALS.map((goal) => ({
        userId,
        weekStart,
        title: goal.title,
        targetType: goal.targetType,
        targetCount: goal.targetCount,
        progressCount: 0,
        createdAt: stamp,
        updatedAt: stamp,
      })),
    );
  }

  const rows = await db
    .select()
    .from(userWeeklyGoals)
    .where(
      and(eq(userWeeklyGoals.userId, userId), eq(userWeeklyGoals.weekStart, weekStart)),
    );

  const updated: WeeklyGoalItem[] = [];

  for (const row of rows) {
    const auto = await computeAutoProgress(userId, weekStart, row.targetType);
    if (auto !== null && auto !== row.progressCount) {
      const next = Math.min(auto, Math.max(row.targetCount, auto));
      const [saved] = await db
        .update(userWeeklyGoals)
        .set({
          progressCount: next,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userWeeklyGoals.id, row.id))
        .returning();
      updated.push(mapGoal(saved ?? { ...row, progressCount: next }));
    } else {
      updated.push(mapGoal(row));
    }
  }

  return updated;
}

export async function incrementCustomWeeklyGoal(
  userId: string,
  goalId: string,
): Promise<WeeklyGoalItem | null> {
  if (!isDatabaseConfigured()) return null;

  const db = getDb();
  const rows = await db
    .select()
    .from(userWeeklyGoals)
    .where(and(eq(userWeeklyGoals.id, goalId), eq(userWeeklyGoals.userId, userId)))
    .limit(1);

  const existing = rows[0];
  if (!existing || existing.targetType !== "custom") {
    return existing ? mapGoal(existing) : null;
  }

  const next = Math.min(existing.targetCount, existing.progressCount + 1);
  const [saved] = await db
    .update(userWeeklyGoals)
    .set({
      progressCount: next,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userWeeklyGoals.id, goalId))
    .returning();

  return saved ? mapGoal(saved) : null;
}
