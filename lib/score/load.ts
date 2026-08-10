import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import { getAllCompletedNodeSlugs } from "@/lib/progress/repository";
import type { BuilderScoreResult } from "@/types/score";

import { calculateBuilderScore } from "./calculate";
import { gatherBuilderScoreInputs } from "./gather";

export async function loadBuilderScore(
  userId: string,
  progressByRoadmap?: Record<string, string[]>,
): Promise<BuilderScoreResult> {
  const progress = progressByRoadmap ?? (await getAllCompletedNodeSlugs(userId));
  const roadmaps = buildAllRoadmapProgressSummaries(progress);

  const projectsCompleted = roadmaps.reduce(
    (sum, item) => sum + item.completedProjects.length,
    0,
  );
  const roadmapsCompleted = roadmaps.filter(
    (item) => item.total > 0 && item.completed === item.total,
  ).length;

  const inputs = await gatherBuilderScoreInputs(userId, {
    projectsCompleted,
    roadmapsCompleted,
  });

  return calculateBuilderScore(inputs);
}
