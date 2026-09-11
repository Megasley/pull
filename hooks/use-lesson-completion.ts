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
  const { completedIds, setNodeCompleted } = useRoadmapProgress(roadmapSlug, roadmap);
  const isComplete = completedIds.has(lessonSlug);
  const roadmapProgress = calculateRoadmapProgress(roadmap.nodes, completedIds);

  const markComplete = useCallback(() => {
    setNodeCompleted(lessonSlug, true);
  }, [lessonSlug, setNodeCompleted]);

  const markIncomplete = useCallback(() => {
    setNodeCompleted(lessonSlug, false);
  }, [lessonSlug, setNodeCompleted]);

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
