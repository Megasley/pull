import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
} from "@/lib/achievements/definitions";
import { getRoadmap, getRoadmapSlugs } from "@/lib/roadmap/load-roadmap";
import { isPrerequisiteRoadmapComplete } from "@/lib/roadmap/prerequisites";
import type { AchievementEvalContext } from "@/types/achievement";

function roadmapProgressPercent(roadmapSlug: string, completedIds: string[]) {
  const roadmap = getRoadmap(roadmapSlug);
  if (!roadmap || roadmap.nodes.length === 0) return 0;
  return Math.round((completedIds.length / roadmap.nodes.length) * 100);
}

function isRoadmapFullyComplete(roadmapSlug: string, completedIds: Set<string>) {
  const roadmap = getRoadmap(roadmapSlug);
  if (!roadmap) return false;
  return roadmap.nodes.every((node) => completedIds.has(node.id));
}

function findProjectNodeIds(projectSlug: string): Array<{ roadmap: string; nodeId: string }> {
  const matches: Array<{ roadmap: string; nodeId: string }> = [];
  for (const roadmapSlug of getRoadmapSlugs()) {
    const roadmap = getRoadmap(roadmapSlug);
    if (!roadmap) continue;
    for (const node of roadmap.nodes) {
      if (node.project === projectSlug) {
        matches.push({ roadmap: roadmapSlug, nodeId: node.id });
      }
    }
  }
  return matches;
}

export function isAchievementEarned(
  definition: AchievementDefinition,
  context: AchievementEvalContext,
): boolean {
  const { progressByRoadmap, approvedSubmissionCount } = context;
  const criteria = definition.criteria;

  switch (criteria.type) {
    case "lessons_completed": {
      const total = Object.values(progressByRoadmap).flat().length;
      return total >= criteria.min;
    }
    case "roadmap_progress": {
      const completed = progressByRoadmap[criteria.roadmap] ?? [];
      return roadmapProgressPercent(criteria.roadmap, completed) >= criteria.percent;
    }
    case "roadmap_complete": {
      return isRoadmapFullyComplete(
        criteria.roadmap,
        new Set(progressByRoadmap[criteria.roadmap] ?? []),
      );
    }
    case "any_roadmap_complete": {
      return getRoadmapSlugs().some((slug) =>
        isRoadmapFullyComplete(slug, new Set(progressByRoadmap[slug] ?? [])),
      );
    }
    case "any_project_node": {
      for (const roadmapSlug of getRoadmapSlugs()) {
        const roadmap = getRoadmap(roadmapSlug);
        const completed = new Set(progressByRoadmap[roadmapSlug] ?? []);
        if (!roadmap) continue;
        if (roadmap.nodes.some((node) => node.project && completed.has(node.id))) {
          return true;
        }
      }
      return false;
    }
    case "project_slug_complete": {
      return findProjectNodeIds(criteria.projectSlug).some(({ roadmap, nodeId }) =>
        (progressByRoadmap[roadmap] ?? []).includes(nodeId),
      );
    }
    case "nodes_complete": {
      const completed = new Set(progressByRoadmap[criteria.roadmap] ?? []);
      return criteria.nodeIds.every((id) => completed.has(id));
    }
    case "nodes_complete_any": {
      const completed = new Set(progressByRoadmap[criteria.roadmap] ?? []);
      return criteria.nodeIds.some((id) => completed.has(id));
    }
    case "roadmap_unlocked": {
      const roadmap = getRoadmap(criteria.roadmap);
      if (!roadmap?.prerequisiteRoadmap) {
        return true;
      }
      const prerequisiteSlug = roadmap.prerequisiteRoadmap.slug;
      return isPrerequisiteRoadmapComplete(
        prerequisiteSlug,
        new Set(progressByRoadmap[prerequisiteSlug] ?? []),
      );
    }
    case "submissions_approved": {
      return approvedSubmissionCount >= criteria.min;
    }
    default: {
      return false;
    }
  }
}

export function evaluateEarnedAchievementSlugs(
  context: AchievementEvalContext,
): string[] {
  return ACHIEVEMENT_DEFINITIONS.filter((definition) =>
    isAchievementEarned(definition, context),
  ).map((definition) => definition.id);
}
