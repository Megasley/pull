import { countGithubSyncedEntities } from "@/lib/github/store";
import {
  GUEST_DISCOVERY_CONTEXT,
  loadDiscoveryProfileContext,
  recommendDiscoveryRepositories,
} from "@/lib/discovery";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import { getAllCompletedNodeSlugs } from "@/lib/progress/repository";
import { getUnavailableCuratedIssueIds } from "./availability";
import { recommendIssues } from "./engine";
import { loadApprovedSubmittedIssues } from "./submissions";
import type { IssueRecommendationContext } from "@/types/issues";

export const GUEST_ISSUE_CONTEXT: IssueRecommendationContext = {
  completedRoadmapSlugs: [],
  completedProjectSlugs: [],
  languages: [],
  level: 1,
  githubActivityCount: 0,
  recommendedRepoIds: recommendDiscoveryRepositories(GUEST_DISCOVERY_CONTEXT, 6).map(
    (item) => item.repository.id,
  ),
};

export async function loadIssueRecommendationContext(
  userId: string,
): Promise<IssueRecommendationContext> {
  const [base, progressByRoadmap, activity, unavailableIssueIds, submittedIssues] =
    await Promise.all([
      loadDiscoveryProfileContext(userId),
      getAllCompletedNodeSlugs(userId),
      countGithubSyncedEntities(userId),
      getUnavailableCuratedIssueIds(),
      loadApprovedSubmittedIssues(),
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
    githubActivityCount: activity.commits + activity.pullRequests + activity.issues,
    recommendedRepoIds,
    unavailableIssueIds,
    submittedIssues,
  };
}

async function loadGuestIssueContext(): Promise<IssueRecommendationContext> {
  const [unavailableIssueIds, submittedIssues] = await Promise.all([
    getUnavailableCuratedIssueIds(),
    loadApprovedSubmittedIssues(),
  ]);
  return { ...GUEST_ISSUE_CONTEXT, unavailableIssueIds, submittedIssues };
}

export async function loadIssueRecommendationsPageData(userId?: string | null) {
  const context = userId
    ? await loadIssueRecommendationContext(userId)
    : await loadGuestIssueContext();
  const seed = recommendIssues(context, { limit: 24, maxPerRepo: 3 });
  return { context, seed, personalized: Boolean(userId) };
}
