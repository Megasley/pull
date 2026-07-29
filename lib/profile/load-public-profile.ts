import { cache } from "react";

import { getRoadmap } from "@/lib/roadmap/load-roadmap";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import { getAllCompletedNodeSlugs } from "@/lib/progress/repository";
import {
  getApprovedSubmissionCount,
  getUserByUsername,
  listApprovedSubmissionsForUser,
} from "@/lib/profile/repository";
import {
  deriveTechnologies,
  selectFeaturedRepositories,
  selectMergedPrHighlights,
  toPublicTimelineEvents,
} from "@/lib/profile/portfolio";
import {
  listUserAchievements,
} from "@/lib/xp/achievements";
import { buildLevelInfo } from "@/lib/xp/levels";
import { loadBuilderScore } from "@/lib/score";
import { loadOpenSourceReputation } from "@/lib/reputation";
import {
  listGithubCommits,
  listGithubIssues,
  listGithubPullRequests,
  listGithubRepositories,
} from "@/lib/github/store";
import { toPortfolioItem } from "@/lib/portfolio/filter";
import { loadContributionTimeline } from "@/lib/timeline";
import type {
  PublicBuilderProfileData,
  PublicCompletedProject,
} from "@/types/profile";
import { toPublicBuilderProfile } from "@/types/user";

function buildFeaturedProjects(
  progressByRoadmap: Record<string, string[]>,
  approved: Awaited<ReturnType<typeof listApprovedSubmissionsForUser>>,
): PublicCompletedProject[] {
  const fromLessons: PublicCompletedProject[] = [];

  for (const [roadmapSlug, nodeSlugs] of Object.entries(progressByRoadmap)) {
    const roadmap = getRoadmap(roadmapSlug);
    if (!roadmap) continue;

    for (const node of roadmap.nodes) {
      if (!node.project || !nodeSlugs.includes(node.id)) continue;
      const approval = approved.find((item) => item.projectSlug === node.project);
      fromLessons.push({
        roadmapSlug,
        nodeSlug: node.id,
        projectSlug: node.project,
        title: node.title,
        completedAt: null,
        submissionStatus: approval?.status ?? null,
        repoUrl: approval?.repoUrl ?? null,
      });
    }
  }

  const fromApprovals: PublicCompletedProject[] = approved.map((item) => ({
    roadmapSlug: "",
    nodeSlug: "",
    projectSlug: item.projectSlug,
    title: item.projectTitle,
    completedAt: item.reviewedAt ?? item.submittedAt,
    submissionStatus: item.status,
    repoUrl: item.repoUrl,
  }));

  const seen = new Set<string>();
  const merged: PublicCompletedProject[] = [];

  for (const item of [...fromApprovals, ...fromLessons]) {
    if (seen.has(item.projectSlug)) continue;
    seen.add(item.projectSlug);
    merged.push(item);
  }

  return merged.slice(0, 6);
}

async function loadPublicBuilderProfileData(
  username: string,
): Promise<Omit<PublicBuilderProfileData, "isOwner"> | null> {
  const profile = await getUserByUsername(username);

  if (!profile || profile.accountStatus !== "active") {
    return null;
  }

  const progressByRoadmap = await getAllCompletedNodeSlugs(profile.id);
  const [
    achievements,
    approvedCount,
    approved,
    builderScore,
    repositories,
    pullRequests,
    commits,
    issues,
  ] = await Promise.all([
    listUserAchievements(profile.id, progressByRoadmap),
    getApprovedSubmissionCount(profile.id),
    listApprovedSubmissionsForUser(profile.id),
    loadBuilderScore(profile.id, progressByRoadmap),
    listGithubRepositories(profile.id, { limit: 30 }),
    listGithubPullRequests(profile.id, 80),
    listGithubCommits(profile.id, 100),
    listGithubIssues(profile.id, 100),
  ]);

  const [reputation, timelineData] = await Promise.all([
    loadOpenSourceReputation(profile.id),
    loadContributionTimeline(profile.id, { pullRequests, commits, issues }),
  ]);

  const roadmaps = buildAllRoadmapProgressSummaries(progressByRoadmap);
  const portfolioItems = pullRequests.map(toPortfolioItem);
  const mergedPrs = portfolioItems.filter((item) => item.merged);
  const uniqueRepos = new Set(mergedPrs.map((item) => item.repoFullName));
  const featuredProjects = buildFeaturedProjects(progressByRoadmap, approved);
  const technologies = deriveTechnologies([
    ...repositories.map((repo) => repo.language),
    ...portfolioItems.map((item) => item.language),
  ]);

  const lessonsCompleted = Object.values(progressByRoadmap).flat().length;
  const roadmapsStarted = roadmaps.filter((item) => item.completed > 0).length;
  const roadmapsCompleted = roadmaps.filter(
    (item) => item.total > 0 && item.completed === item.total,
  ).length;
  const projectsCompleted = roadmaps.reduce(
    (sum, item) => sum + item.completedProjects.length,
    0,
  );

  return {
    profile: toPublicBuilderProfile(profile),
    level: buildLevelInfo(profile.xp, profile.level),
    builderScore,
    reputation,
    stats: {
      lessonsCompleted,
      roadmapsStarted,
      roadmapsCompleted,
      projectsCompleted,
      projectsApproved: approvedCount,
      achievementsUnlocked: achievements.filter((item) => item.earned).length,
      mergedPullRequests: mergedPrs.length,
      repositories: repositories.length,
      uniqueContributionRepos: uniqueRepos.size,
      languagesUsed: technologies.length,
    },
    skills: profile.skills,
    technologies,
    featuredRepositories: selectFeaturedRepositories(repositories),
    featuredProjects,
    mergedPrHighlights: selectMergedPrHighlights(portfolioItems),
    timeline: toPublicTimelineEvents(timelineData.events),
    roadmaps,
    achievements: achievements.filter((item) => item.earned),
    recentProjects: featuredProjects,
  };
}

const loadPublicBuilderProfileCached = cache(loadPublicBuilderProfileData);

export async function loadPublicBuilderProfile(
  username: string,
  viewerUserId?: string | null,
): Promise<PublicBuilderProfileData | null> {
  const data = await loadPublicBuilderProfileCached(username);

  if (!data) {
    return null;
  }

  return {
    ...data,
    isOwner: Boolean(viewerUserId && viewerUserId === data.profile.id),
  };
}
