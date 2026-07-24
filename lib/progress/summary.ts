import { getRoadmap, getRoadmapSlugs } from "@/lib/roadmap/load-roadmap";
import { calculateRoadmapProgress } from "@/lib/roadmap/progress";
import type { RoadmapJson, RoadmapJsonNode } from "@/types/roadmap";
import type { RoadmapProgressSummary } from "@/types/progress";

export function getResumeNode(
  roadmap: RoadmapJson,
  completedIds: Set<string>,
): RoadmapJsonNode | null {
  return roadmap.nodes.find((node) => !completedIds.has(node.id)) ?? null;
}

export function getCompletedProjects(
  roadmap: RoadmapJson,
  completedIds: Set<string>,
) {
  return roadmap.nodes
    .filter((node) => node.project && completedIds.has(node.id))
    .map((node) => ({
      slug: node.id,
      title: node.title,
      project: node.project!,
    }));
}

export function buildRoadmapProgressSummary(
  roadmapSlug: string,
  completedNodeSlugs: string[],
): RoadmapProgressSummary | null {
  const roadmap = getRoadmap(roadmapSlug);

  if (!roadmap) {
    return null;
  }

  const completedIds = new Set(completedNodeSlugs);
  const progress = calculateRoadmapProgress(roadmap.nodes, completedIds);
  const resumeNode = getResumeNode(roadmap, completedIds);

  return {
    roadmapSlug,
    title: roadmap.title,
    description: roadmap.description ?? "",
    completed: progress.completed,
    total: progress.total,
    percentage: progress.percentage,
    resumeLessonSlug: resumeNode?.id ?? null,
    resumeLessonTitle: resumeNode?.title ?? null,
    completedProjects: getCompletedProjects(roadmap, completedIds),
  };
}

export function buildAllRoadmapProgressSummaries(
  progressByRoadmap: Record<string, string[]>,
): RoadmapProgressSummary[] {
  return getRoadmapSlugs()
    .map((slug) =>
      buildRoadmapProgressSummary(slug, progressByRoadmap[slug] ?? []),
    )
    .filter((summary): summary is RoadmapProgressSummary => summary !== null);
}
