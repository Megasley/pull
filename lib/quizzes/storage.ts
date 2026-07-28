import { PULL_STORAGE_PREFIX } from "@/lib/storage/brand-keys";

export type ChapterQuizStatus = "passed" | "skipped";

const CHAPTER_QUIZ_PREFIX = `${PULL_STORAGE_PREFIX}chapter-quiz:`;

function storageKey(userId: string, roadmapSlug: string, quizId: string) {
  return `${CHAPTER_QUIZ_PREFIX}${userId}:${roadmapSlug}:${quizId}`;
}

export function readStoredChapterQuizStatus(
  userId: string,
  roadmapSlug: string,
  quizId: string,
): ChapterQuizStatus | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey(userId, roadmapSlug, quizId));
  return raw === "passed" || raw === "skipped" ? raw : null;
}

export function writeStoredChapterQuizStatus(
  userId: string,
  roadmapSlug: string,
  quizId: string,
  status: ChapterQuizStatus,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(userId, roadmapSlug, quizId), status);
}
