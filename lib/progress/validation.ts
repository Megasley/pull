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
  checkpoint: RoadmapJsonNode;
  checkpointNodeSlug: string;
  quiz: LessonChapterQuiz;
  quizId: string;
  sectionId: string;
};

type ChapterQuizRelationshipInput = {
  roadmapSlug: unknown;
  quizId?: string;
  checkpointNodeSlug?: string;
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
  if (typeof quizId !== "string") {
    return { ok: false, reason: "invalid_input" };
  }

  return resolveChapterQuizRelationship({ roadmapSlug, quizId });
}

export function resolveCheckpointChapterQuiz(
  canonical: CanonicalNode,
): ValidationResult<CanonicalQuiz> {
  return resolveChapterQuizRelationship({
    roadmapSlug: canonical.roadmapSlug,
    checkpointNodeSlug: canonical.nodeSlug,
  });
}

export function resolveChapterQuizRelationship(
  input: ChapterQuizRelationshipInput,
): ValidationResult<CanonicalQuiz> {
  const roadmapResult = resolveRoadmap(input.roadmapSlug);
  if (!roadmapResult.ok) {
    return roadmapResult;
  }

  const roadmapSlug = input.roadmapSlug as string;
  const quizzes = getChapterQuizzesForRoadmap(roadmapSlug);
  const requestedQuiz = input.quizId
    ? quizzes.find((quiz) => quiz.id === input.quizId)
    : null;
  const requestedCheckpoint = input.checkpointNodeSlug
    ? roadmapResult.value.nodes.find(
        (node) =>
          node.id === input.checkpointNodeSlug && node.chapterCheckpoint === true,
      )
    : null;

  if (
    (!input.quizId && !input.checkpointNodeSlug) ||
    (input.quizId && !requestedQuiz) ||
    (input.checkpointNodeSlug && !requestedCheckpoint)
  ) {
    return { ok: false, reason: "invalid_quiz" };
  }

  const sectionId = requestedQuiz?.sectionId ?? requestedCheckpoint?.sectionId;
  if (
    !sectionId ||
    (requestedQuiz &&
      requestedCheckpoint &&
      requestedQuiz.sectionId !== requestedCheckpoint.sectionId)
  ) {
    return { ok: false, reason: "invalid_quiz" };
  }

  const sectionQuizzes = quizzes.filter((quiz) => quiz.sectionId === sectionId);
  const sectionCheckpoints = roadmapResult.value.nodes.filter(
    (node) => node.sectionId === sectionId && node.chapterCheckpoint === true,
  );

  if (sectionQuizzes.length !== 1 || sectionCheckpoints.length !== 1) {
    return { ok: false, reason: "invalid_quiz" };
  }

  const [quiz] = sectionQuizzes;
  const [checkpoint] = sectionCheckpoints;
  if (
    quiz.id !== `${roadmapSlug}:${sectionId}` ||
    (input.quizId && quiz.id !== input.quizId) ||
    (input.checkpointNodeSlug && checkpoint.id !== input.checkpointNodeSlug)
  ) {
    return { ok: false, reason: "invalid_quiz" };
  }

  return {
    ok: true,
    value: {
      roadmap: roadmapResult.value,
      roadmapSlug,
      checkpoint,
      checkpointNodeSlug: checkpoint.id,
      quiz,
      quizId: quiz.id,
      sectionId,
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
