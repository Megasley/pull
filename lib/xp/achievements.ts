import { and, count, eq } from "drizzle-orm";

import { evaluateEarnedAchievementSlugs } from "@/lib/achievements/evaluate";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements/definitions";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  achievements,
  projectSubmissions,
  userAchievements,
  userRoadmapProgress,
} from "@/lib/db/schema";
import { getRoadmap } from "@/lib/roadmap/load-roadmap";
import {
  achievementXpKey,
  lessonXpKey,
  roadmapXpKey,
  submissionXpKey,
} from "@/lib/xp/config";
import { awardXp, revokeXp } from "@/lib/xp/repository";
import type { AchievementItem } from "@/types/dashboard";

const RECENT_UNLOCK_MS = 5 * 60 * 1000;

async function getProgressByRoadmap(
  userId: string,
): Promise<Record<string, string[]>> {
  if (!isDatabaseConfigured()) {
    return {};
  }

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
}

async function getApprovedSubmissionCount(userId: string): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.userId, userId),
        eq(projectSubmissions.status, "approved"),
      ),
    );

  return Number(rows[0]?.value ?? 0);
}

export async function ensureAchievementsCatalog() {
  if (!isDatabaseConfigured()) {
    return;
  }

  const db = getDb();

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const payload = {
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      xpReward: definition.xpReward,
      criteria: definition.criteria as unknown as Record<string, unknown>,
      updatedAt: new Date().toISOString(),
    };

    await db
      .insert(achievements)
      .values({
        slug: definition.id,
        ...payload,
      })
      .onConflictDoUpdate({
        target: achievements.slug,
        set: payload,
      });
  }
}

export async function syncAchievementsForUser(userId: string): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureAchievementsCatalog();

  const progressByRoadmap = await getProgressByRoadmap(userId);
  const approvedSubmissionCount = await getApprovedSubmissionCount(userId);
  const earnedSlugs = evaluateEarnedAchievementSlugs({
    progressByRoadmap,
    approvedSubmissionCount,
  });

  const db = getDb();
  const unlocked: string[] = [];

  for (const slug of earnedSlugs) {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.slug, slug))
      .limit(1);

    if (!achievement) continue;

    const inserted = await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId: achievement.id,
      })
      .onConflictDoNothing({
        target: [userAchievements.userId, userAchievements.achievementId],
      })
      .returning({ id: userAchievements.id });

    if (inserted.length === 0) {
      continue;
    }

    unlocked.push(slug);

    if (achievement.xpReward > 0) {
      await awardXp({
        userId,
        sourceType: "achievement",
        sourceKey: achievementXpKey(slug),
        amount: achievement.xpReward,
        metadata: { achievementSlug: slug },
      });
    }
  }

  if (unlocked.length > 0) {
    const { notifyAchievementsUnlockedAsync } = await import(
      "@/lib/notifications/dispatch"
    );
    notifyAchievementsUnlockedAsync({ userId, slugs: unlocked });
  }

  return unlocked;
}

export async function listUserAchievements(
  userId: string,
  progressByRoadmap: Record<string, string[]>,
): Promise<AchievementItem[]> {
  const approvedSubmissionCount = await getApprovedSubmissionCount(userId);
  const earnedSlugs = new Set(
    evaluateEarnedAchievementSlugs({
      progressByRoadmap,
      approvedSubmissionCount,
    }),
  );
  let earnedAtBySlug: Record<string, string> = {};

  if (isDatabaseConfigured()) {
    await ensureAchievementsCatalog();
    const db = getDb();
    const rows = await db
      .select({
        slug: achievements.slug,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    earnedAtBySlug = Object.fromEntries(
      rows.map((row) => [row.slug, row.earnedAt]),
    );

    for (const slug of Object.keys(earnedAtBySlug)) {
      earnedSlugs.add(slug);
    }
  }

  const now = Date.now();

  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const earnedAt = earnedAtBySlug[achievement.id] ?? null;
    const recentlyUnlocked = Boolean(
      earnedAt && now - new Date(earnedAt).getTime() < RECENT_UNLOCK_MS,
    );

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      xpReward: achievement.xpReward,
      earned: earnedSlugs.has(achievement.id),
      earnedAt,
      recentlyUnlocked,
    };
  });
}

export async function onLessonCompleted(
  userId: string,
  roadmapSlug: string,
  nodeSlug: string,
) {
  await awardXp({
    userId,
    sourceType: "lesson_complete",
    sourceKey: lessonXpKey(roadmapSlug, nodeSlug),
    metadata: { roadmapSlug, nodeSlug },
  });

  const roadmap = getRoadmap(roadmapSlug);
  if (roadmap) {
    const progress = await getProgressByRoadmap(userId);
    const completed = new Set(progress[roadmapSlug] ?? []);
    const allDone = roadmap.nodes.every((node) => completed.has(node.id));

    if (allDone) {
      await awardXp({
        userId,
        sourceType: "roadmap_complete",
        sourceKey: roadmapXpKey(roadmapSlug),
        metadata: { roadmapSlug },
      });
    }
  }

  await syncAchievementsForUser(userId);
}

export async function onLessonUncompleted(
  userId: string,
  roadmapSlug: string,
  nodeSlug: string,
) {
  await revokeXp({
    userId,
    sourceType: "lesson_complete",
    sourceKey: lessonXpKey(roadmapSlug, nodeSlug),
  });

  const roadmap = getRoadmap(roadmapSlug);
  if (roadmap) {
    const progress = await getProgressByRoadmap(userId);
    const completed = new Set(progress[roadmapSlug] ?? []);
    const allDone = roadmap.nodes.every((node) => completed.has(node.id));
    if (!allDone) {
      await revokeXp({
        userId,
        sourceType: "roadmap_complete",
        sourceKey: roadmapXpKey(roadmapSlug),
      });
    }
  }
}

export async function onProjectSubmitted(userId: string, submissionId: string) {
  await awardXp({
    userId,
    sourceType: "project_submitted",
    sourceKey: submissionXpKey(submissionId),
    metadata: { submissionId },
  });
  await syncAchievementsForUser(userId);
}

export async function onProjectApproved(
  userId: string,
  submissionId: string,
  options?: { prUrl?: string | null },
) {
  await awardXp({
    userId,
    sourceType: "project_approved",
    sourceKey: submissionXpKey(submissionId),
    metadata: { submissionId },
  });

  if (options?.prUrl) {
    await awardXp({
      userId,
      sourceType: "merged_pr",
      sourceKey: submissionXpKey(submissionId),
      metadata: { submissionId, prUrl: options.prUrl },
    });
  }

  await syncAchievementsForUser(userId);
}
