import { getRoadmap } from "@/lib/roadmap/load-roadmap";
import type { LessonMeta, LessonNavigation } from "@/types/content";

import { getLessonMeta } from "./load-lessons";

export function getLessonNavigation(
  roadmapSlug: string,
  lessonSlug: string,
): LessonNavigation {
  const roadmap = getRoadmap(roadmapSlug);

  if (!roadmap) {
    return { previous: null, next: null };
  }

  const nodeIndex = roadmap.nodes.findIndex((node) => node.id === lessonSlug);

  if (nodeIndex === -1) {
    return { previous: null, next: null };
  }

  const previousNode = nodeIndex > 0 ? roadmap.nodes[nodeIndex - 1] : undefined;
  const nextNode =
    nodeIndex < roadmap.nodes.length - 1 ? roadmap.nodes[nodeIndex + 1] : undefined;

  const toMeta = (nodeId: string): LessonMeta | null =>
    getLessonMeta(roadmapSlug, nodeId);

  return {
    previous: previousNode ? toMeta(previousNode.id) : null,
    next: nextNode ? toMeta(nextNode.id) : null,
  };
}
