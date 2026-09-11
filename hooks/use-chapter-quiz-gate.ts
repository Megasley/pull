"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchChapterQuizStatusAction,
  submitChapterQuizAction,
} from "@/app/actions/progress";
import {
  clearStoredChapterQuizStatus,
  readStoredChapterQuizStatus,
  writeStoredChapterQuizStatus,
  type ChapterQuizStatus,
} from "@/lib/quizzes/storage";
import type {
  ChapterQuizAnswer,
  ChapterQuizSubmissionResult,
  LessonChapterQuiz,
} from "@/types/content";

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
      if (!cancelled && result.authenticated) {
        setStatus(result.status);
        if (result.status) {
          writeStoredChapterQuizStatus(
            userId,
            roadmapSlug,
            activeQuiz.id,
            result.status,
          );
        } else {
          clearStoredChapterQuizStatus(userId, roadmapSlug, activeQuiz.id);
        }
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

  const canMarkComplete = !quiz || !isAuthenticated || status === "passed";

  const handleSubmit = useCallback(
    async (
      answers: ChapterQuizAnswer[],
    ): Promise<ChapterQuizSubmissionResult | null> => {
      if (!quiz || !userId) {
        return null;
      }

      const result = await submitChapterQuizAction({
        roadmapSlug,
        quizId: quiz.id,
        answers,
      });

      if (!result.ok) {
        return null;
      }

      if (result.passed) {
        setStatus("passed");
        writeStoredChapterQuizStatus(userId, roadmapSlug, quiz.id, "passed");
      }

      return { passed: result.passed, score: result.score };
    },
    [quiz, roadmapSlug, userId],
  );

  return {
    status,
    hydrated,
    canMarkComplete,
    handleSubmit,
  };
}
