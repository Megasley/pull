import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { getDb, isDbConnectionError, withDbRetry } from "@/lib/db";
import { userRoadmapProgress } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getRoadmap, getRoadmapSlugs } from "@/lib/roadmap/load-roadmap";

function nowIso(): string {
  return new Date().toISOString();
}

export function canonicalRoadmapProgressFilter(): SQL {
  const filters = getRoadmapSlugs().flatMap((roadmapSlug) => {
    const roadmap = getRoadmap(roadmapSlug);
    return roadmap
      ? [
          and(
            eq(userRoadmapProgress.roadmapSlug, roadmapSlug),
            inArray(
              userRoadmapProgress.nodeSlug,
              roadmap.nodes.map((node) => node.id),
            ),
          ),
        ]
      : [];
  });

  return or(...filters) ?? sql`false`;
}

export async function getCompletedNodeSlugs(
  userId: string,
  roadmapSlug: string,
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const roadmap = getRoadmap(roadmapSlug);
  if (!roadmap) {
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
            inArray(
              userRoadmapProgress.nodeSlug,
              roadmap.nodes.map((node) => node.id),
            ),
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
            canonicalRoadmapProgressFilter(),
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
            canonicalRoadmapProgressFilter(),
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
