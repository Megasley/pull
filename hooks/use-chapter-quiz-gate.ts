"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchChapterQuizStatusAction,
  skipChapterQuizAction,
  submitChapterQuizAction,
} from "@/app/actions/progress";
import {
  readStoredChapterQuizStatus,
  writeStoredChapterQuizStatus,
  type ChapterQuizStatus,
} from "@/lib/quizzes/storage";
import type { LessonChapterQuiz } from "@/types/content";

export function useChapterQuizGate(
  roadmapSlug: string,
  quiz: LessonChapterQuiz | null,
  userId: string | null,
  isAuthenticated: boolean,
) {
  const [status, setStatus] = useState<ChapterQuizStatus | null>(null);
  const [hydrated, setHydrated] = useState(() => !quiz);

  useEffect(() => {
    if (!quiz) {
      return;
    }

    const activeQuiz = quiz;
    let cancelled = false;

    async function hydrate() {
      if (!isAuthenticated || !userId) {
        setHydrated(true);
        return;
      }

      const cached = readStoredChapterQuizStatus(userId, roadmapSlug, activeQuiz.id);
      if (cached) {
        setStatus(cached);
      }

      const result = await fetchChapterQuizStatusAction(roadmapSlug, activeQuiz.id);
      if (!cancelled && result.authenticated && result.status) {
        setStatus(result.status);
        writeStoredChapterQuizStatus(userId, roadmapSlug, activeQuiz.id, result.status);
      }

      if (!cancelled) {
        setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, quiz, roadmapSlug, userId]);

  const canMarkComplete =
    !quiz || !isAuthenticated || status === "passed" || status === "skipped";

  const handlePassed = useCallback(
    async (score: number) => {
      if (!quiz || !userId) {
        return;
      }

      setStatus("passed");
      writeStoredChapterQuizStatus(userId, roadmapSlug, quiz.id, "passed");
      await submitChapterQuizAction({
        roadmapSlug,
        quizId: quiz.id,
        score,
      });
    },
    [quiz, roadmapSlug, userId],
  );

  const handleSkip = useCallback(async () => {
    if (!quiz || !userId) {
      return;
    }

    setStatus("skipped");
    writeStoredChapterQuizStatus(userId, roadmapSlug, quiz.id, "skipped");
    await skipChapterQuizAction({ roadmapSlug, quizId: quiz.id });
  }, [quiz, roadmapSlug, userId]);

  return {
    status,
    hydrated,
    canMarkComplete,
    handlePassed,
    handleSkip,
  };
}
