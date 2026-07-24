import { and, desc, eq } from "drizzle-orm";

import { getDb, isDbConnectionError, withDbRetry } from "@/lib/db";
import { userRoadmapProgress } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/env";

function nowIso(): string {
  return new Date().toISOString();
}

export async function getCompletedNodeSlugs(
  userId: string,
  roadmapSlug: string,
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    return await withDbRetry(async () => {
      const db = getDb();
      const rows = await db
        .select({ nodeSlug: userRoadmapProgress.nodeSlug })
        .from(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.userId, userId),
            eq(userRoadmapProgress.roadmapSlug, roadmapSlug),
            eq(userRoadmapProgress.status, "completed"),
          ),
        );

      return rows.map((row) => row.nodeSlug);
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[progress] getCompletedNodeSlugs unavailable", error);
      return [];
    }
    throw error;
  }
}

export async function getAllCompletedNodeSlugs(
  userId: string,
): Promise<Record<string, string[]>> {
  if (!isDatabaseConfigured()) {
    return {};
  }

  try {
    return await withDbRetry(async () => {
      const db = getDb();
      const rows = await db
        .select({
          roadmapSlug: userRoadmapProgress.roadmapSlug,
          nodeSlug: userRoadmapProgress.nodeSlug,
        })
        .from(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.userId, userId),
            eq(userRoadmapProgress.status, "completed"),
          ),
        );

      const progress: Record<string, string[]> = {};

      for (const row of rows) {
        progress[row.roadmapSlug] ??= [];
        progress[row.roadmapSlug].push(row.nodeSlug);
      }

      return progress;
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[progress] getAllCompletedNodeSlugs unavailable", error);
      return {};
    }
    throw error;
  }
}

export async function getRecentCompletedLessons(
  userId: string,
  limit = 5,
): Promise<
  Array<{
    roadmapSlug: string;
    nodeSlug: string;
    completedAt: string | null;
  }>
> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    return await withDbRetry(async () => {
      const db = getDb();
      return db
        .select({
          roadmapSlug: userRoadmapProgress.roadmapSlug,
          nodeSlug: userRoadmapProgress.nodeSlug,
          completedAt: userRoadmapProgress.completedAt,
        })
        .from(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.userId, userId),
            eq(userRoadmapProgress.status, "completed"),
          ),
        )
        .orderBy(desc(userRoadmapProgress.completedAt))
        .limit(limit);
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[progress] getRecentCompletedLessons unavailable", error);
      return [];
    }
    throw error;
  }
}

export async function setNodeCompletion(
  userId: string,
  roadmapSlug: string,
  nodeSlug: string,
  completed: boolean,
): Promise<void> {
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
            eq(userRoadmapProgress.roadmapSlug, roadmapSlug),
            eq(userRoadmapProgress.nodeSlug, nodeSlug),
          ),
        );

      const { onLessonUncompleted } = await import("@/lib/xp/achievements");
      await onLessonUncompleted(userId, roadmapSlug, nodeSlug);

      return;
    }

    const timestamp = nowIso();

    await db
      .insert(userRoadmapProgress)
      .values({
        userId,
        roadmapSlug,
        nodeSlug,
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

    const { onLessonCompleted } = await import("@/lib/xp/achievements");
    await onLessonCompleted(userId, roadmapSlug, nodeSlug);
  });
}

export async function mergeRoadmapProgress(
  userId: string,
  roadmapSlug: string,
  completedNodeSlugs: string[],
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return completedNodeSlugs;
  }

  const existing = new Set(await getCompletedNodeSlugs(userId, roadmapSlug));
  const merged = new Set([...existing, ...completedNodeSlugs]);

  for (const nodeSlug of merged) {
    await setNodeCompletion(userId, roadmapSlug, nodeSlug, true);
  }

  return [...merged];
}

export async function replaceRoadmapProgress(
  userId: string,
  roadmapSlug: string,
  completedNodeSlugs: string[],
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return completedNodeSlugs;
  }

  const existing = await getCompletedNodeSlugs(userId, roadmapSlug);
  const incoming = new Set(completedNodeSlugs);

  for (const nodeSlug of existing) {
    if (!incoming.has(nodeSlug)) {
      await setNodeCompletion(userId, roadmapSlug, nodeSlug, false);
    }
  }

  for (const nodeSlug of incoming) {
    await setNodeCompletion(userId, roadmapSlug, nodeSlug, true);
  }

  return [...incoming];
}
