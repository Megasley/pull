"use client";

import { useCallback } from "react";

import { useRoadmapProgress } from "@/hooks/use-roadmap-progress";
import { calculateRoadmapProgress } from "@/lib/roadmap/progress";
import type { RoadmapJson } from "@/types/roadmap";

export function useLessonCompletion(
  roadmapSlug: string,
  lessonSlug: string,
  roadmap: RoadmapJson,
) {
  const { completedIds, setCompletedIds } = useRoadmapProgress(roadmapSlug, roadmap);
  const isComplete = completedIds.has(lessonSlug);
  const roadmapProgress = calculateRoadmapProgress(roadmap.nodes, completedIds);

  const markComplete = useCallback(() => {
    setCompletedIds((current) => new Set([...current, lessonSlug]));
  }, [lessonSlug, setCompletedIds]);

  const markIncomplete = useCallback(() => {
    setCompletedIds((current) => {
      const next = new Set(current);
      next.delete(lessonSlug);
      return next;
    });
  }, [lessonSlug, setCompletedIds]);

  const toggleComplete = useCallback(() => {
    if (isComplete) {
      markIncomplete();
    } else {
      markComplete();
    }
  }, [isComplete, markComplete, markIncomplete]);

  return {
    isComplete,
    markComplete,
    markIncomplete,
    toggleComplete,
    roadmapProgress,
  };
}
