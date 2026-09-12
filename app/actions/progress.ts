"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import {
  moderationBlockedMessage,
  requireActiveAccount,
} from "@/lib/auth/require-active-account";
import {
  getAllCompletedNodeSlugs,
  getCompletedNodeSlugs,
  setNodeCompletion,
} from "@/lib/progress/repository";
import {
  getChapterQuizStatus,
  getChapterQuizStatuses,
  recordChapterQuizPassed,
} from "@/lib/progress/quiz-repository";
import {
  gradeChapterQuizAnswers,
  resolveCheckpointChapterQuiz,
  resolveChapterQuiz,
  resolveRoadmap,
  resolveRoadmapNode,
  type CanonicalNode,
  type ProgressValidationReason,
} from "@/lib/progress/validation";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import type { ChapterQuizAnswer } from "@/types/content";
import type { RoadmapProgressSummary } from "@/types/progress";

async function validateCompletionEligibility(
  userId: string,
  canonical: CanonicalNode,
): Promise<ProgressValidationReason | null> {
  const completed = new Set(await getCompletedNodeSlugs(userId, canonical.roadmapSlug));

  if (completed.has(canonical.nodeSlug)) {
    return null;
  }

  const prerequisiteSlug = canonical.roadmap.prerequisiteRoadmap?.slug;
  if (prerequisiteSlug) {
    const prerequisite = resolveRoadmap(prerequisiteSlug);
    if (!prerequisite.ok) {
      return "roadmap_locked";
    }
    const prerequisiteCompleted = new Set(
      await getCompletedNodeSlugs(userId, prerequisiteSlug),
    );
    if (!prerequisite.value.nodes.every((node) => prerequisiteCompleted.has(node.id))) {
      return "roadmap_locked";
    }
  }

  if (
    canonical.node.status === "locked" ||
    canonical.node.lockedUntil?.some((nodeId) => !completed.has(nodeId))
  ) {
    return "node_locked";
  }

  if (canonical.node.chapterCheckpoint) {
    const relationship = resolveCheckpointChapterQuiz(canonical);
    if (!relationship.ok) {
      return relationship.reason;
    }
    const status = await getChapterQuizStatus(
      userId,
      relationship.value.roadmapSlug,
      relationship.value.quizId,
    );
    if (status !== "passed") {
      return "chapter_quiz_required";
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function fetchRoadmapProgressAction(roadmapSlug: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { authenticated: false as const, completedNodeSlugs: [] as string[] };
  }

  const roadmap = resolveRoadmap(roadmapSlug);
  if (!roadmap.ok) {
    return {
      authenticated: true as const,
      completedNodeSlugs: [] as string[],
      error: roadmap.reason,
    };
  }

  const completedNodeSlugs = await getCompletedNodeSlugs(user.id, roadmapSlug);

  return {
    authenticated: true as const,
    completedNodeSlugs,
  };
}

export async function toggleLessonProgressAction(
  roadmapSlug: string,
  nodeSlug: string,
  completed: boolean,
) {
  const gate = await requireActiveAccount();

  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: moderationBlockedMessage(gate.reason),
    };
  }

  if (typeof completed !== "boolean") {
    return { ok: false as const, reason: "invalid_input" as const };
  }

  const canonical = resolveRoadmapNode(roadmapSlug, nodeSlug);
  if (!canonical.ok) {
    return { ok: false as const, reason: canonical.reason };
  }

  if (completed) {
    const reason = await validateCompletionEligibility(
      gate.profile.id,
      canonical.value,
    );
    if (reason) {
      return { ok: false as const, reason };
    }
  }

  await setNodeCompletion(
    gate.profile.id,
    canonical.value.roadmapSlug,
    canonical.value.nodeSlug,
    completed,
  );
  revalidatePath("/dashboard");
  revalidatePath(`/roadmaps/${roadmapSlug}`);
  revalidatePath(`/roadmaps/${roadmapSlug}/lessons/${nodeSlug}`);

  return { ok: true as const };
}

export async function getDashboardProgressAction(): Promise<RoadmapProgressSummary[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const progressByRoadmap = await getAllCompletedNodeSlugs(user.id);

  return buildAllRoadmapProgressSummaries(progressByRoadmap);
}

export async function fetchChapterQuizStatusAction(
  roadmapSlug: string,
  quizId: string,
) {
  const user = await getCurrentUser();

  if (!user) {
    return { authenticated: false as const, status: null };
  }

  const quiz = resolveChapterQuiz(roadmapSlug, quizId);
  if (!quiz.ok) {
    return { authenticated: true as const, status: null, error: quiz.reason };
  }

  const status = await getChapterQuizStatus(
    user.id,
    quiz.value.roadmapSlug,
    quiz.value.quizId,
  );

  return { authenticated: true as const, status };
}

export async function fetchChapterQuizStatusesAction(roadmapSlug: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { authenticated: false as const, statuses: {} as Record<string, string> };
  }

  const roadmap = resolveRoadmap(roadmapSlug);
  if (!roadmap.ok) {
    return {
      authenticated: true as const,
      statuses: {} as Record<string, string>,
      error: roadmap.reason,
    };
  }

  const statuses = await getChapterQuizStatuses(user.id, roadmapSlug);

  return { authenticated: true as const, statuses };
}

export async function submitChapterQuizAction(input: {
  roadmapSlug: string;
  quizId: string;
  answers: ChapterQuizAnswer[];
}) {
  const gate = await requireActiveAccount();

  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const record = asRecord(input);
  if (!record) {
    return { ok: false as const, reason: "invalid_input" as const };
  }

  const canonical = resolveChapterQuiz(record.roadmapSlug, record.quizId);
  if (!canonical.ok) {
    return { ok: false as const, reason: canonical.reason };
  }

  const graded = gradeChapterQuizAnswers(canonical.value.quiz, record.answers);
  if (!graded.ok) {
    return { ok: false as const, reason: graded.reason };
  }

  if (!graded.value.passed) {
    return {
      ok: true as const,
      passed: false as const,
      score: graded.value.score,
    };
  }

  await recordChapterQuizPassed({
    userId: gate.profile.id,
    roadmapSlug: canonical.value.roadmapSlug,
    quizId: canonical.value.quizId,
    score: graded.value.score,
  });

  revalidatePath("/dashboard");

  return { ok: true as const, passed: true as const, score: graded.value.score };
}
