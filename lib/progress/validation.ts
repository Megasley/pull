import { getChapterQuizzesForRoadmap } from "@/lib/quizzes/load";
import { getRoadmap } from "@/lib/roadmap/load-roadmap";
import type { ChapterQuizAnswer, LessonChapterQuiz } from "@/types/content";
import type { RoadmapJson, RoadmapJsonNode } from "@/types/roadmap";

export type ProgressValidationReason =
  | "invalid_input"
  | "invalid_roadmap"
  | "invalid_node"
  | "invalid_quiz"
  | "invalid_answers"
  | "roadmap_locked"
  | "node_locked"
  | "chapter_quiz_required";

type ValidationFailure = {
  ok: false;
  reason: ProgressValidationReason;
};

type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type CanonicalNode = {
  roadmap: RoadmapJson;
  roadmapSlug: string;
  node: RoadmapJsonNode;
  nodeSlug: string;
};

export type CanonicalQuiz = {
  roadmap: RoadmapJson;
  roadmapSlug: string;
  quiz: LessonChapterQuiz;
  quizId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resolveRoadmap(roadmapSlug: unknown): ValidationResult<RoadmapJson> {
  if (typeof roadmapSlug !== "string") {
    return { ok: false, reason: "invalid_input" };
  }

  const roadmap = getRoadmap(roadmapSlug);
  return roadmap
    ? { ok: true, value: roadmap }
    : { ok: false, reason: "invalid_roadmap" };
}

export function resolveRoadmapNode(
  roadmapSlug: unknown,
  nodeSlug: unknown,
): ValidationResult<CanonicalNode> {
  const roadmapResult = resolveRoadmap(roadmapSlug);
  if (!roadmapResult.ok) {
    return roadmapResult;
  }
  if (typeof nodeSlug !== "string") {
    return { ok: false, reason: "invalid_input" };
  }

  const node = roadmapResult.value.nodes.find((item) => item.id === nodeSlug);
  if (!node) {
    return { ok: false, reason: "invalid_node" };
  }

  return {
    ok: true,
    value: {
      roadmap: roadmapResult.value,
      roadmapSlug: roadmapSlug as string,
      node,
      nodeSlug,
    },
  };
}

export function resolveChapterQuiz(
  roadmapSlug: unknown,
  quizId: unknown,
): ValidationResult<CanonicalQuiz> {
  const roadmapResult = resolveRoadmap(roadmapSlug);
  if (!roadmapResult.ok) {
    return roadmapResult;
  }
  if (typeof quizId !== "string") {
    return { ok: false, reason: "invalid_input" };
  }

  const quiz = getChapterQuizzesForRoadmap(roadmapSlug as string).find(
    (item) => item.id === quizId,
  );
  if (!quiz) {
    return { ok: false, reason: "invalid_quiz" };
  }

  const hasCheckpoint = roadmapResult.value.nodes.some(
    (node) => node.sectionId === quiz.sectionId && node.chapterCheckpoint === true,
  );
  if (!hasCheckpoint) {
    return { ok: false, reason: "invalid_quiz" };
  }

  return {
    ok: true,
    value: {
      roadmap: roadmapResult.value,
      roadmapSlug: roadmapSlug as string,
      quiz,
      quizId,
    },
  };
}

export function gradeChapterQuizAnswers(
  quiz: LessonChapterQuiz,
  answers: unknown,
): ValidationResult<{ answers: ChapterQuizAnswer[]; score: number; passed: boolean }> {
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    return { ok: false, reason: "invalid_answers" };
  }

  const questions = new Map(quiz.questions.map((question) => [question.id, question]));
  const seen = new Set<string>();
  const validated: ChapterQuizAnswer[] = [];
  let score = 0;

  for (const answer of answers) {
    if (!isRecord(answer)) {
      return { ok: false, reason: "invalid_answers" };
    }

    const { questionId, optionId } = answer;
    if (
      typeof questionId !== "string" ||
      typeof optionId !== "string" ||
      seen.has(questionId)
    ) {
      return { ok: false, reason: "invalid_answers" };
    }

    const question = questions.get(questionId);
    if (!question || !question.options.some((option) => option.id === optionId)) {
      return { ok: false, reason: "invalid_answers" };
    }

    seen.add(questionId);
    validated.push({ questionId, optionId });
    if (optionId === question.correctOptionId) {
      score += 1;
    }
  }

  if (seen.size !== quiz.questions.length) {
    return { ok: false, reason: "invalid_answers" };
  }

  return {
    ok: true,
    value: {
      answers: validated,
      score,
      passed: score >= quiz.passingScore,
    },
  };
}

export function isCanonicalNodeReference(
  roadmapSlug: string,
  nodeSlug: string,
): boolean {
  return resolveRoadmapNode(roadmapSlug, nodeSlug).ok;
}

export function isCanonicalQuizReference(roadmapSlug: string, quizId: string): boolean {
  return resolveChapterQuiz(roadmapSlug, quizId).ok;
}
