import bitcoinQuizzes from "@/content/quizzes/bitcoin.json";
import lightningQuizzes from "@/content/quizzes/lightning.json";
import type { LessonChapterQuiz } from "@/types/content";

const quizCatalog: Record<string, LessonChapterQuiz[]> = {
  bitcoin: bitcoinQuizzes as LessonChapterQuiz[],
  lightning: lightningQuizzes as LessonChapterQuiz[],
};

export function getChapterQuizzesForRoadmap(roadmapSlug: string): LessonChapterQuiz[] {
  return quizCatalog[roadmapSlug] ?? [];
}

export function getChapterQuizBySection(
  roadmapSlug: string,
  sectionId: string,
): LessonChapterQuiz | null {
  return (
    getChapterQuizzesForRoadmap(roadmapSlug).find(
      (quiz) => quiz.sectionId === sectionId,
    ) ?? null
  );
}
