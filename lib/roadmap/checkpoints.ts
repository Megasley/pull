import type { LessonChapterQuiz } from "@/types/content";
import type { RoadmapJson, RoadmapJsonNode } from "@/types/roadmap";

export function getRoadmapNode(
  roadmap: RoadmapJson,
  lessonSlug: string,
): RoadmapJsonNode | null {
  return roadmap.nodes.find((node) => node.id === lessonSlug) ?? null;
}

export function getSectionForLesson(
  roadmap: RoadmapJson,
  lessonSlug: string,
): string | null {
  return getRoadmapNode(roadmap, lessonSlug)?.sectionId ?? null;
}

export function isChapterCheckpointLesson(
  roadmap: RoadmapJson,
  lessonSlug: string,
): boolean {
  const node = getRoadmapNode(roadmap, lessonSlug);
  return node?.chapterCheckpoint === true;
}

export function getChapterQuizForLesson(
  roadmap: RoadmapJson,
  lessonSlug: string,
  quizzes: LessonChapterQuiz[],
): LessonChapterQuiz | null {
  if (!isChapterCheckpointLesson(roadmap, lessonSlug)) {
    return null;
  }

  const sectionId = getSectionForLesson(roadmap, lessonSlug);
  if (!sectionId) {
    return null;
  }

  return quizzes.find((quiz) => quiz.sectionId === sectionId) ?? null;
}

export function getProjectSlugForLesson(
  roadmap: RoadmapJson,
  lessonSlug: string,
): string | null {
  return getRoadmapNode(roadmap, lessonSlug)?.project ?? null;
}
