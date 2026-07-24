import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  projectSubmissions,
  projects,
  submissionReviews,
} from "@/lib/db/schema";
import {
  getGithubConnection,
  listGithubContributionDays,
  listGithubIssues,
  listGithubPullRequests,
} from "@/lib/github/store";
import { loadIssueRecommendationContext } from "@/lib/issues/load";
import { recommendIssues } from "@/lib/issues/engine";
import { listApprovedSubmissionsForUser } from "@/lib/profile/repository";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import type {
  AssignedIssueItem,
  BuiltProjectItem,
  ContributingRepoItem,
  ContributionStreak,
  OpenPullRequestItem,
  OpenSourceOpportunity,
  PortfolioCompletion,
  ReviewReceivedItem,
} from "@/types/dashboard";
import type { GithubContributionDay } from "@/types/github";
import type { BuilderProfile } from "@/types/user";

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeContributionStreak(
  days: GithubContributionDay[],
): ContributionStreak {
  if (days.length === 0) {
    return { current: 0, longest: 0, totalDays: 0 };
  }

  const byDate = new Map(days.map((day) => [day.date, day.count]));
  const totalDays = days.filter((day) => day.count > 0).length;

  let longest = 0;
  let run = 0;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sorted) {
    if (day.count > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  let cursor =
    (byDate.get(todayKey) ?? 0) > 0
      ? today
      : (byDate.get(yesterdayKey) ?? 0) > 0
        ? yesterday
        : null;

  let current = 0;
  if (cursor) {
    while (true) {
      const key = toDateKey(cursor);
      if ((byDate.get(key) ?? 0) <= 0) break;
      current += 1;
      cursor = new Date(cursor);
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  return { current, longest, totalDays };
}

export async function loadContributionStreak(
  userId: string,
): Promise<ContributionStreak> {
  const days = await listGithubContributionDays(userId);
  return computeContributionStreak(days);
}

export async function loadProjectsBuilt(
  userId: string,
  progressByRoadmap: Record<string, string[]>,
): Promise<BuiltProjectItem[]> {
  const [approved, summaries] = await Promise.all([
    listApprovedSubmissionsForUser(userId),
    Promise.resolve(buildAllRoadmapProgressSummaries(progressByRoadmap)),
  ]);

  const items: BuiltProjectItem[] = [];
  const seen = new Set<string>();

  for (const submission of approved) {
    const key = `submission:${submission.projectSlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: submission.id,
      title: submission.projectTitle,
      projectSlug: submission.projectSlug,
      source: "submission",
      href: `/projects/${submission.projectSlug}`,
      completedAt: submission.reviewedAt ?? submission.updatedAt,
    });
  }

  for (const summary of summaries) {
    for (const project of summary.completedProjects) {
      const key = `roadmap:${summary.roadmapSlug}:${project.slug}`;
      if (seen.has(`submission:${project.project}`)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: key,
        title: project.title,
        projectSlug: project.project,
        source: "roadmap",
        href: `/roadmaps/${summary.roadmapSlug}/lessons/${project.slug}`,
        completedAt: null,
      });
    }
  }

  return items.slice(0, 8);
}

export async function loadContributingRepos(
  userId: string,
): Promise<ContributingRepoItem[]> {
  const [openPrs, openIssues] = await Promise.all([
    listGithubPullRequests(userId, { state: "open", limit: 100 }),
    listGithubIssues(userId, { state: "open", limit: 100 }),
  ]);

  const map = new Map<
    string,
    { openPullRequests: number; openIssues: number }
  >();

  for (const pr of openPrs) {
    const entry = map.get(pr.repoFullName) ?? {
      openPullRequests: 0,
      openIssues: 0,
    };
    entry.openPullRequests += 1;
    map.set(pr.repoFullName, entry);
  }

  for (const issue of openIssues) {
    const entry = map.get(issue.repoFullName) ?? {
      openPullRequests: 0,
      openIssues: 0,
    };
    entry.openIssues += 1;
    map.set(issue.repoFullName, entry);
  }

  return [...map.entries()]
    .map(([fullName, counts]) => ({
      fullName,
      openPullRequests: counts.openPullRequests,
      openIssues: counts.openIssues,
      href: `https://github.com/${fullName}`,
    }))
    .sort(
      (a, b) =>
        b.openPullRequests +
        b.openIssues -
        (a.openPullRequests + a.openIssues),
    )
    .slice(0, 8);
}

export async function loadOpenPullRequests(
  userId: string,
): Promise<OpenPullRequestItem[]> {
  const prs = await listGithubPullRequests(userId, {
    state: "open",
    limit: 8,
  });

  return prs.map((pr) => ({
    id: pr.id,
    title: pr.title,
    number: pr.number,
    repoFullName: pr.repoFullName,
    htmlUrl: pr.htmlUrl,
    reviewComments: pr.reviewComments,
    githubCreatedAt: pr.githubCreatedAt,
  }));
}

export async function loadAssignedIssues(
  userId: string,
): Promise<AssignedIssueItem[]> {
  const issues = await listGithubIssues(userId, {
    state: "open",
    relation: "assigned",
    limit: 8,
  });

  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    number: issue.number,
    repoFullName: issue.repoFullName,
    htmlUrl: issue.htmlUrl,
    githubCreatedAt: issue.githubCreatedAt,
  }));
}

export async function loadReviewsReceived(
  userId: string,
): Promise<ReviewReceivedItem[]> {
  if (!isDatabaseConfigured()) return [];

  const db = getDb();
  const rows = await db
    .select({
      id: submissionReviews.id,
      decision: submissionReviews.decision,
      reviewRound: submissionReviews.reviewRound,
      body: submissionReviews.body,
      createdAt: submissionReviews.createdAt,
      projectSlug: projects.slug,
      projectTitle: projects.title,
      submissionId: projectSubmissions.id,
    })
    .from(submissionReviews)
    .innerJoin(
      projectSubmissions,
      eq(submissionReviews.submissionId, projectSubmissions.id),
    )
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .where(eq(projectSubmissions.userId, userId))
    .orderBy(desc(submissionReviews.createdAt))
    .limit(8);

  return rows.map((row) => ({
    id: row.id,
    projectTitle: row.projectTitle,
    projectSlug: row.projectSlug,
    decision: row.decision,
    reviewRound: row.reviewRound,
    body: row.body,
    createdAt: row.createdAt,
    href: `/projects/${row.projectSlug}/submit`,
  }));
}

export function computePortfolioCompletion(input: {
  profile: BuilderProfile;
  githubConnected: boolean;
  hasMergedPr: boolean;
  hasApprovedProject: boolean;
}): PortfolioCompletion {
  const items = [
    {
      id: "bio",
      label: "Write a bio",
      done: input.profile.bio.trim().length >= 20,
      href: "/settings/profile",
    },
    {
      id: "avatar",
      label: "Add a profile photo",
      done: Boolean(input.profile.avatar),
      href: "/settings/profile",
    },
    {
      id: "skills",
      label: "List at least one skill",
      done: input.profile.skills.length > 0,
      href: "/settings/profile",
    },
    {
      id: "links",
      label: "Add a website or social link",
      done: Boolean(
        input.profile.website ||
          input.profile.twitterUrl ||
          input.profile.linkedinUrl,
      ),
      href: "/settings/profile",
    },
    {
      id: "github",
      label: "Connect GitHub sync",
      done: input.githubConnected,
      href: "/settings/github",
    },
    {
      id: "evidence",
      label: "Ship a project or merge a PR",
      done: input.hasMergedPr || input.hasApprovedProject,
      href: input.hasApprovedProject ? "/portfolio" : "/discover",
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const total = items.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { percentage, completed, total, items };
}

export async function loadPortfolioCompletion(
  userId: string,
  profile: BuilderProfile,
): Promise<PortfolioCompletion> {
  const [connection, mergedPrs, approvedCount] = await Promise.all([
    getGithubConnection(userId),
    listGithubPullRequests(userId, { merged: true, limit: 1 }),
    listApprovedSubmissionsForUser(userId),
  ]);

  return computePortfolioCompletion({
    profile,
    githubConnected: Boolean(connection),
    hasMergedPr: mergedPrs.length > 0,
    hasApprovedProject: approvedCount.length > 0,
  });
}

export async function loadSuggestedContributions(
  userId: string,
): Promise<OpenSourceOpportunity[]> {
  const context = await loadIssueRecommendationContext(userId);
  const recommendations = recommendIssues(context, { limit: 3, maxPerRepo: 1 });

  return recommendations.map((item) => ({
    id: item.issue.id,
    title: item.issue.title,
    repository: item.repositoryFullName,
    description: item.reasons[0] ?? item.issue.summary,
    url: item.issue.url,
    tags: [item.issue.category, item.issue.language, ...item.issue.labels].slice(
      0,
      4,
    ),
  }));
}

export async function loadDashboardWorkspace(input: {
  userId: string;
  profile: BuilderProfile;
  progressByRoadmap: Record<string, string[]>;
}) {
  const [
    contributionStreak,
    projectsBuilt,
    contributingRepos,
    openPullRequests,
    assignedIssues,
    reviewsReceived,
    portfolioCompletion,
    openSourceOpportunities,
  ] = await Promise.all([
    loadContributionStreak(input.userId),
    loadProjectsBuilt(input.userId, input.progressByRoadmap),
    loadContributingRepos(input.userId),
    loadOpenPullRequests(input.userId),
    loadAssignedIssues(input.userId),
    loadReviewsReceived(input.userId),
    loadPortfolioCompletion(input.userId, input.profile),
    loadSuggestedContributions(input.userId),
  ]);

  return {
    contributionStreak,
    projectsBuilt,
    contributingRepos,
    openPullRequests,
    assignedIssues,
    reviewsReceived,
    portfolioCompletion,
    openSourceOpportunities,
  };
}
