import { countGithubSyncedEntities } from "@/lib/github/store";
import {
  loadDiscoveryProfileContext,
  recommendDiscoveryRepositories,
} from "@/lib/discovery";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import { getAllCompletedNodeSlugs } from "@/lib/progress/repository";
import { recommendIssues } from "./engine";
import type { IssueRecommendationContext } from "@/types/issues";

export async function loadIssueRecommendationContext(
  userId: string,
): Promise<IssueRecommendationContext> {
  const [base, progressByRoadmap, activity] = await Promise.all([
    loadDiscoveryProfileContext(userId),
    getAllCompletedNodeSlugs(userId),
    countGithubSyncedEntities(userId),
  ]);

  const roadmaps = buildAllRoadmapProgressSummaries(progressByRoadmap);
  const completedProjectSlugs = roadmaps.flatMap((item) =>
    item.completedProjects.map((project) => project.project),
  );

  const recommendedRepoIds = recommendDiscoveryRepositories(base, 6).map(
    (item) => item.repository.id,
  );

  return {
    completedRoadmapSlugs: base.completedRoadmapSlugs,
    completedProjectSlugs,
    languages: base.languages,
    level: base.level,
    githubActivityCount:
      activity.commits + activity.pullRequests + activity.issues,
    recommendedRepoIds,
  };
}

export async function loadIssueRecommendationsPageData(userId: string) {
  const context = await loadIssueRecommendationContext(userId);
  const seed = recommendIssues(context, { limit: 24, maxPerRepo: 3 });
  return { context, seed };
}
