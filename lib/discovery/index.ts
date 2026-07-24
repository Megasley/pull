import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import { getAllCompletedNodeSlugs } from "@/lib/progress/repository";
import { listGithubRepositories } from "@/lib/github/store";
import { getBuilderProfile } from "@/lib/auth/ensure-builder-profile";
import {
  getAllDiscoveryRepositories,
  recommendDiscoveryRepositories,
} from "./catalog";
import type { DiscoveryProfileContext } from "@/types/discovery";

export async function loadDiscoveryProfileContext(
  userId: string,
): Promise<DiscoveryProfileContext> {
  const [progressByRoadmap, repos, profile] = await Promise.all([
    getAllCompletedNodeSlugs(userId),
    listGithubRepositories(userId),
    getBuilderProfile(userId),
  ]);

  const roadmaps = buildAllRoadmapProgressSummaries(progressByRoadmap);
  const completedRoadmapSlugs = roadmaps
    .filter((item) => item.total > 0 && item.completed === item.total)
    .map((item) => item.roadmapSlug);

  const languages = [
    ...new Set(
      repos
        .map((repo) => repo.language)
        .filter((language): language is string => Boolean(language)),
    ),
  ];

  return {
    completedRoadmapSlugs,
    languages,
    level: profile?.level ?? 1,
  };
}

export async function loadDiscoveryPageData(userId: string) {
  const context = await loadDiscoveryProfileContext(userId);
  const repositories = getAllDiscoveryRepositories();
  const recommendations = recommendDiscoveryRepositories(context, 4);

  return {
    context,
    repositories,
    recommendations,
  };
}

export {
  getAllDiscoveryRepositories,
  getDiscoveryLanguages,
  getDiscoveryTopics,
  filterDiscoveryRepositories,
  paginateDiscoveryRepositories,
  recommendDiscoveryRepositories,
  DISCOVERY_PAGE_SIZE,
  DISCOVERY_DIFFICULTY_OPTIONS,
  DISCOVERY_SIZE_OPTIONS,
} from "./catalog";

export {
  getBookmarkedDiscoveryIds,
  getServerDiscoveryBookmarks,
  isDiscoveryBookmarked,
  toggleDiscoveryBookmark,
  subscribeDiscoveryBookmarks,
  EMPTY_DISCOVERY_BOOKMARKS,
} from "./bookmarks";
