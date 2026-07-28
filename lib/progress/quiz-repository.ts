import { and, eq } from "drizzle-orm";

import { getDb, isDbConnectionError, withDbRetry } from "@/lib/db";
import { userChapterQuizzes } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/env";
import { awardXp } from "@/lib/xp/repository";
import { chapterQuizXpKey } from "@/lib/xp/config";

export type ChapterQuizRecordStatus = "passed" | "skipped";

function nowIso(): string {
  return new Date().toISOString();
}

export async function getChapterQuizStatus(
  userId: string,
  roadmapSlug: string,
  quizId: string,
): Promise<ChapterQuizRecordStatus | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    return await withDbRetry(async () => {
      const db = getDb();
      const rows = await db
        .select({ status: userChapterQuizzes.status })
        .from(userChapterQuizzes)
        .where(
          and(
            eq(userChapterQuizzes.userId, userId),
            eq(userChapterQuizzes.roadmapSlug, roadmapSlug),
            eq(userChapterQuizzes.quizId, quizId),
          ),
        )
        .limit(1);

      const status = rows[0]?.status;
      return status === "passed" || status === "skipped" ? status : null;
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[quiz] getChapterQuizStatus unavailable", error);
      return null;
    }
    throw error;
  }
}

export async function getChapterQuizStatuses(
  userId: string,
  roadmapSlug: string,
): Promise<Record<string, ChapterQuizRecordStatus>> {
  if (!isDatabaseConfigured()) {
    return {};
  }

  try {
    return await withDbRetry(async () => {
      const db = getDb();
      const rows = await db
        .select({
          quizId: userChapterQuizzes.quizId,
          status: userChapterQuizzes.status,
        })
        .from(userChapterQuizzes)
        .where(
          and(
            eq(userChapterQuizzes.userId, userId),
            eq(userChapterQuizzes.roadmapSlug, roadmapSlug),
          ),
        );

      const result: Record<string, ChapterQuizRecordStatus> = {};
      for (const row of rows) {
        if (row.status === "passed" || row.status === "skipped") {
          result[row.quizId] = row.status;
        }
      }
      return result;
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[quiz] getChapterQuizStatuses unavailable", error);
      return {};
    }
    throw error;
  }
}

async function upsertChapterQuizStatus(input: {
  userId: string;
  roadmapSlug: string;
  quizId: string;
  status: ChapterQuizRecordStatus;
  score?: number | null;
}) {
  const db = getDb();
  const timestamp = nowIso();

  await db
    .insert(userChapterQuizzes)
    .values({
      userId: input.userId,
      roadmapSlug: input.roadmapSlug,
      quizId: input.quizId,
      status: input.status,
      score: input.score ?? null,
      completedAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: [
        userChapterQuizzes.userId,
        userChapterQuizzes.roadmapSlug,
        userChapterQuizzes.quizId,
      ],
      set: {
        status: input.status,
        score: input.score ?? null,
        completedAt: timestamp,
        updatedAt: timestamp,
      },
    });
}

export async function recordChapterQuizPassed(input: {
  userId: string;
  roadmapSlug: string;
  quizId: string;
  score: number;
}) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await withDbRetry(async () => {
    await upsertChapterQuizStatus({
      userId: input.userId,
      roadmapSlug: input.roadmapSlug,
      quizId: input.quizId,
      status: "passed",
      score: input.score,
    });

    await awardXp({
      userId: input.userId,
      sourceType: "chapter_quiz_passed",
      sourceKey: chapterQuizXpKey(input.roadmapSlug, input.quizId),
    });
  });
}

export async function recordChapterQuizSkipped(input: {
  userId: string;
  roadmapSlug: string;
  quizId: string;
}) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await withDbRetry(async () => {
    await upsertChapterQuizStatus({
      userId: input.userId,
      roadmapSlug: input.roadmapSlug,
      quizId: input.quizId,
      status: "skipped",
      score: null,
    });
  });
}
