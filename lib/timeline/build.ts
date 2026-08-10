import { and, desc, eq, ne } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  projectSubmissions,
  projects,
  submissionReviewEvents,
  xpEvents,
} from "@/lib/db/schema";
import { getRoadmap } from "@/lib/roadmap/load-roadmap";
import {
  listGithubCommits,
  listGithubIssues,
  listGithubPullRequests,
} from "@/lib/github/store";
import { listRecentUserSubmissions } from "@/lib/submissions/repository";
import type { ContributionTimelineData, TimelineEvent } from "@/types/timeline";

import { countByType, sortTimelineEvents } from "./filter";

async function listReviewEventsForUser(userId: string): Promise<TimelineEvent[]> {
  if (!isDatabaseConfigured()) return [];

  const db = getDb();
  const rows = await db
    .select({
      id: submissionReviewEvents.id,
      type: submissionReviewEvents.type,
      body: submissionReviewEvents.body,
      toStatus: submissionReviewEvents.toStatus,
      createdAt: submissionReviewEvents.createdAt,
      projectSlug: projects.slug,
      projectTitle: projects.title,
      submissionId: projectSubmissions.id,
    })
    .from(submissionReviewEvents)
    .innerJoin(
      projectSubmissions,
      eq(submissionReviewEvents.submissionId, projectSubmissions.id),
    )
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .where(
      and(
        eq(submissionReviewEvents.actorUserId, userId),
        ne(projectSubmissions.userId, userId),
      ),
    )
    .orderBy(desc(submissionReviewEvents.createdAt))
    .limit(100);

  return rows.map((row) => ({
    id: `review:${row.id}`,
    type: "review" as const,
    title:
      row.type === "comment"
        ? `Reviewed ${row.projectTitle}`
        : `Moved ${row.projectTitle} to ${row.toStatus?.replaceAll("_", " ") ?? "updated"}`,
    description:
      row.body.trim() ||
      (row.type === "comment"
        ? "Left review feedback for another builder."
        : "Updated a submission review status."),
    occurredAt: row.createdAt,
    href: `/review/${row.submissionId}`,
    meta: row.projectSlug,
  }));
}

async function listRoadmapCompletions(userId: string): Promise<TimelineEvent[]> {
  if (!isDatabaseConfigured()) return [];

  const db = getDb();
  const rows = await db
    .select({
      id: xpEvents.id,
      sourceKey: xpEvents.sourceKey,
      createdAt: xpEvents.createdAt,
    })
    .from(xpEvents)
    .where(
      and(eq(xpEvents.userId, userId), eq(xpEvents.sourceType, "roadmap_complete")),
    )
    .orderBy(desc(xpEvents.createdAt))
    .limit(50);

  return rows.map((row) => {
    const roadmap = getRoadmap(row.sourceKey);
    return {
      id: `roadmap:${row.id}`,
      type: "roadmap_completion" as const,
      title: `Completed ${roadmap?.title ?? row.sourceKey} roadmap`,
      description:
        roadmap?.description ?? "Finished every lesson on this Pull roadmap.",
      occurredAt: row.createdAt,
      href: `/roadmaps/${row.sourceKey}`,
      meta: row.sourceKey,
    };
  });
}

export async function loadContributionTimeline(
  userId: string,
  preload?: {
    pullRequests?: Awaited<ReturnType<typeof listGithubPullRequests>>;
    commits?: Awaited<ReturnType<typeof listGithubCommits>>;
    issues?: Awaited<ReturnType<typeof listGithubIssues>>;
  },
): Promise<ContributionTimelineData> {
  const [commits, pullRequests, issues, reviews, submissions, roadmaps] =
    await Promise.all([
      preload?.commits
        ? Promise.resolve(preload.commits)
        : listGithubCommits(userId, 100),
      preload?.pullRequests
        ? Promise.resolve(preload.pullRequests)
        : listGithubPullRequests(userId, 100),
      preload?.issues ? Promise.resolve(preload.issues) : listGithubIssues(userId, 100),
      listReviewEventsForUser(userId),
      listRecentUserSubmissions(userId, 50),
      listRoadmapCompletions(userId),
    ]);

  const events: TimelineEvent[] = [];

  for (const commit of commits) {
    if (!commit.committedAt) continue;
    events.push({
      id: `commit:${commit.id}`,
      type: "commit",
      title: commit.message,
      description: `Committed to ${commit.repoFullName}`,
      occurredAt: commit.committedAt,
      href: commit.htmlUrl,
      meta: commit.sha.slice(0, 7),
    });
  }

  for (const pr of pullRequests) {
    if (pr.githubCreatedAt) {
      events.push({
        id: `pr:${pr.id}`,
        type: "pull_request",
        title: pr.title,
        description: `Opened PR #${pr.number} in ${pr.repoFullName}`,
        occurredAt: pr.githubCreatedAt,
        href: pr.htmlUrl,
        meta: `#${pr.number}`,
      });
    }

    if (pr.merged && pr.githubMergedAt) {
      events.push({
        id: `merged:${pr.id}`,
        type: "merged",
        title: pr.title,
        description: `Merged PR #${pr.number} in ${pr.repoFullName}`,
        occurredAt: pr.githubMergedAt,
        href: pr.htmlUrl,
        meta: `#${pr.number}`,
      });
    }
  }

  for (const issue of issues) {
    if (!issue.githubCreatedAt) continue;
    events.push({
      id: `issue:${issue.id}`,
      type: "issue",
      title: issue.title,
      description: `Opened issue #${issue.number} in ${issue.repoFullName}`,
      occurredAt: issue.githubCreatedAt,
      href: issue.htmlUrl,
      meta: `#${issue.number}`,
    });
  }

  events.push(...reviews);

  for (const submission of submissions) {
    // Prefer submittedAt; fall back to updatedAt for drafts that were saved.
    const occurredAt = submission.submittedAt ?? submission.updatedAt;
    if (!occurredAt) continue;

    const statusLabel = submission.status.replaceAll("_", " ");
    events.push({
      id: `submission:${submission.id}`,
      type: "project_submission",
      title: submission.projectTitle,
      description: `Project submission ${statusLabel}`,
      occurredAt,
      href: `/projects/${submission.projectSlug}/submit`,
      meta: statusLabel,
    });
  }

  events.push(...roadmaps);

  const sorted = sortTimelineEvents(events);

  return {
    events: sorted,
    totals: countByType(sorted),
  };
}
