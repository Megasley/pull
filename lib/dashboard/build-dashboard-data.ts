import { lessonExists } from "@/lib/content/paths";
import { getRoadmap, getRoadmapSlugs } from "@/lib/roadmap/load-roadmap";
import {
  isNodeLockedByPrerequisites,
  resolveNodeStatuses,
} from "@/lib/roadmap/progress";
import { isPrerequisiteRoadmapComplete } from "@/lib/roadmap/prerequisites";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import type {
  AchievementItem,
  BuilderLevelInfo,
  ContinueLearningItem,
  DashboardData,
  ProjectInProgressItem,
  RecentLessonItem,
  RecommendedLessonItem,
} from "@/types/dashboard";
import type { RoadmapProgressSummary } from "@/types/progress";
import type { BuilderProfile } from "@/types/user";

import { evaluateEarnedAchievementSlugs } from "@/lib/achievements/evaluate";
import { ACHIEVEMENT_DEFINITIONS } from "./catalog";
import { buildLevelInfo } from "@/lib/xp/levels";

function isRoadmapAccessible(
  roadmapSlug: string,
  progressByRoadmap: Record<string, string[]>,
): boolean {
  const roadmap = getRoadmap(roadmapSlug);

  if (!roadmap) {
    return false;
  }

  if (!roadmap.prerequisiteRoadmap) {
    return true;
  }

  const prerequisiteSlug = roadmap.prerequisiteRoadmap.slug;
  const completed = new Set(progressByRoadmap[prerequisiteSlug] ?? []);

  return isPrerequisiteRoadmapComplete(prerequisiteSlug, completed);
}

function getNodeTitle(roadmapSlug: string, nodeSlug: string): string {
  const roadmap = getRoadmap(roadmapSlug);
  return roadmap?.nodes.find((node) => node.id === nodeSlug)?.title ?? nodeSlug;
}

function buildContinueLearning(
  summaries: RoadmapProgressSummary[],
  progressByRoadmap: Record<string, string[]>,
): ContinueLearningItem | null {
  for (const summary of summaries) {
    if (!summary.resumeLessonSlug || !summary.resumeLessonTitle) {
      continue;
    }

    if (!isRoadmapAccessible(summary.roadmapSlug, progressByRoadmap)) {
      continue;
    }

    const roadmap = getRoadmap(summary.roadmapSlug);
    const node = roadmap?.nodes.find((item) => item.id === summary.resumeLessonSlug);

    if (!node || !lessonExists(summary.roadmapSlug, summary.resumeLessonSlug)) {
      continue;
    }

    return {
      roadmapSlug: summary.roadmapSlug,
      roadmapTitle: summary.title,
      lessonSlug: summary.resumeLessonSlug,
      lessonTitle: summary.resumeLessonTitle,
      description: node.description ?? summary.description,
      duration: node.duration ?? "-",
      difficulty: node.difficulty ?? "beginner",
    };
  }

  const bitcoin = getRoadmap("bitcoin");
  const firstNode = bitcoin?.nodes[0];

  if (firstNode && lessonExists("bitcoin", firstNode.id)) {
    return {
      roadmapSlug: "bitcoin",
      roadmapTitle: bitcoin.title,
      lessonSlug: firstNode.id,
      lessonTitle: firstNode.title,
      description: firstNode.description ?? bitcoin.description ?? "",
      duration: firstNode.duration ?? "-",
      difficulty: firstNode.difficulty ?? "beginner",
    };
  }

  return null;
}

function buildRecentLessons(
  progressByRoadmap: Record<string, string[]>,
  recentFromDb: Array<{
    roadmapSlug: string;
    nodeSlug: string;
    completedAt: string | null;
  }>,
): RecentLessonItem[] {
  if (recentFromDb.length > 0) {
    return recentFromDb
      .filter((item) => lessonExists(item.roadmapSlug, item.nodeSlug))
      .map((item) => ({
        roadmapSlug: item.roadmapSlug,
        lessonSlug: item.nodeSlug,
        title: getNodeTitle(item.roadmapSlug, item.nodeSlug),
        completedAt: item.completedAt,
      }));
  }

  const fallback: RecentLessonItem[] = [];

  for (const roadmapSlug of getRoadmapSlugs()) {
    const completed = progressByRoadmap[roadmapSlug] ?? [];

    for (const nodeSlug of completed.slice(-3).reverse()) {
      if (!lessonExists(roadmapSlug, nodeSlug)) {
        continue;
      }

      fallback.push({
        roadmapSlug,
        lessonSlug: nodeSlug,
        title: getNodeTitle(roadmapSlug, nodeSlug),
        completedAt: null,
      });
    }
  }

  return fallback.slice(0, 5);
}

function buildProjectsInProgress(
  progressByRoadmap: Record<string, string[]>,
): ProjectInProgressItem[] {
  const projects: ProjectInProgressItem[] = [];

  for (const roadmapSlug of getRoadmapSlugs()) {
    if (!isRoadmapAccessible(roadmapSlug, progressByRoadmap)) {
      continue;
    }

    const roadmap = getRoadmap(roadmapSlug);

    if (!roadmap) {
      continue;
    }

    const completedIds = new Set(progressByRoadmap[roadmapSlug] ?? []);
    const statuses = resolveNodeStatuses(roadmap.nodes, completedIds);

    for (const node of roadmap.nodes) {
      if (!node.project || completedIds.has(node.id)) {
        continue;
      }

      const status = statuses.get(node.id);

      if (status === "locked") {
        continue;
      }

      projects.push({
        roadmapSlug,
        nodeSlug: node.id,
        title: node.title,
        project: node.project,
        duration: node.duration ?? "-",
        difficulty: node.difficulty ?? "intermediate",
      });
    }
  }

  return projects.slice(0, 4);
}

function buildRecommendedLessons(
  progressByRoadmap: Record<string, string[]>,
): RecommendedLessonItem[] {
  const recommendations: RecommendedLessonItem[] = [];

  for (const roadmapSlug of getRoadmapSlugs()) {
    if (!isRoadmapAccessible(roadmapSlug, progressByRoadmap)) {
      continue;
    }

    const roadmap = getRoadmap(roadmapSlug);

    if (!roadmap) {
      continue;
    }

    const completedIds = new Set(progressByRoadmap[roadmapSlug] ?? []);

    for (const node of roadmap.nodes) {
      if (completedIds.has(node.id)) {
        continue;
      }

      if (
        isNodeLockedByPrerequisites(node, completedIds) ||
        !lessonExists(roadmapSlug, node.id)
      ) {
        continue;
      }

      recommendations.push({
        roadmapSlug,
        roadmapTitle: roadmap.title,
        lessonSlug: node.id,
        title: node.title,
        description: node.description ?? "",
        duration: node.duration ?? "-",
        difficulty: node.difficulty ?? "beginner",
      });

      if (recommendations.length >= 4) {
        return recommendations;
      }
    }
  }

  return recommendations;
}

function buildAchievements(
  progressByRoadmap: Record<string, string[]>,
): AchievementItem[] {
  const earned = new Set(
    evaluateEarnedAchievementSlugs({
      progressByRoadmap,
      approvedSubmissionCount: 0,
    }),
  );

  return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    xpReward: achievement.xpReward,
    earned: earned.has(achievement.id),
  }));
}

function buildBuilderLevel(profile: BuilderProfile): BuilderLevelInfo {
  return buildLevelInfo(profile.xp, profile.level);
}

export function buildDashboardData(input: {
  profile: BuilderProfile;
  progressByRoadmap: Record<string, string[]>;
  recentFromDb: Array<{
    roadmapSlug: string;
    nodeSlug: string;
    completedAt: string | null;
  }>;
}): DashboardData {
  const roadmapProgress = buildAllRoadmapProgressSummaries(input.progressByRoadmap);

  return {
    profile: input.profile,
    continueLearning: buildContinueLearning(roadmapProgress, input.progressByRoadmap),
    roadmapProgress,
    recentLessons: buildRecentLessons(input.progressByRoadmap, input.recentFromDb),
    projectsInProgress: buildProjectsInProgress(input.progressByRoadmap),
    achievements: buildAchievements(input.progressByRoadmap),
    builderLevel: buildBuilderLevel(input.profile),
    builderScore: null,
    reputation: null,
    recommendedLessons: buildRecommendedLessons(input.progressByRoadmap),
    openSourceOpportunities: [],
    contributionStreak: { current: 0, longest: 0, totalDays: 0 },
    projectsBuilt: [],
    contributingRepos: [],
    openPullRequests: [],
    assignedIssues: [],
    reviewsReceived: [],
    portfolioCompletion: {
      percentage: 0,
      completed: 0,
      total: 0,
      items: [],
    },
    weeklyGoals: [],
  };
}

export function getPrimaryContinueTarget(data: DashboardData) {
  if (data.continueLearning) {
    return `/roadmaps/${data.continueLearning.roadmapSlug}/lessons/${data.continueLearning.lessonSlug}`;
  }

  return "/roadmaps/bitcoin";
}
