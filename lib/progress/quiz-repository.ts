import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { getDb, isDbConnectionError, withDbRetry } from "@/lib/db";
import { userChapterQuizzes } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  isCanonicalQuizReference,
  resolveChapterQuiz,
} from "@/lib/progress/validation";
import { getChapterQuizzesForRoadmap } from "@/lib/quizzes/load";
import { getRoadmapSlugs } from "@/lib/roadmap/load-roadmap";
import { awardXp } from "@/lib/xp/repository";
import { chapterQuizXpKey } from "@/lib/xp/config";

export type ChapterQuizRecordStatus = "passed";

export function canonicalChapterQuizFilter(): SQL {
  const filters = getRoadmapSlugs().flatMap((roadmapSlug) => {
    const quizIds = getChapterQuizzesForRoadmap(roadmapSlug).map((quiz) => quiz.id);
    return quizIds.length > 0
      ? [
          and(
            eq(userChapterQuizzes.roadmapSlug, roadmapSlug),
            inArray(userChapterQuizzes.quizId, quizIds),
          ),
        ]
      : [];
  });

  return or(...filters) ?? sql`false`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function getChapterQuizStatus(
  userId: string,
  roadmapSlug: string,
  quizId: string,
): Promise<ChapterQuizRecordStatus | null> {
  if (!isCanonicalQuizReference(roadmapSlug, quizId)) {
    return null;
  }
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
      return status === "passed" ? status : null;
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

  const quizIds = getChapterQuizzesForRoadmap(roadmapSlug).map((quiz) => quiz.id);
  if (quizIds.length === 0) {
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
            inArray(userChapterQuizzes.quizId, quizIds),
          ),
        );

      const result: Record<string, ChapterQuizRecordStatus> = {};
      for (const row of rows) {
        if (row.status === "passed") {
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
  const resolved = resolveChapterQuiz(input.roadmapSlug, input.quizId);
  if (
    !resolved.ok ||
    !Number.isInteger(input.score) ||
    input.score < resolved.value.quiz.passingScore ||
    input.score > resolved.value.quiz.questions.length
  ) {
    throw new Error("Cannot record an invalid chapter quiz pass.");
  }
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
