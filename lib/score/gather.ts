import { and, count, eq, gte, ne, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  projectSubmissions,
  submissionReviewEvents,
  userRoadmapProgress,
  xpEvents,
} from "@/lib/db/schema";
import type { BuilderScoreInputs } from "@/types/score";

import { CONSISTENCY_WINDOW_WEEKS } from "./weights";

function weekKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  // ISO week-ish bucket: year + week number
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${utc.getUTCFullYear()}-W${week}`;
}

export function countActiveWeeks(
  timestamps: Array<string | null | undefined>,
  windowWeeks = CONSISTENCY_WINDOW_WEEKS,
  now = new Date(),
): number {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - windowWeeks * 7);
  const cutoffMs = cutoff.getTime();

  const weeks = new Set<string>();
  for (const stamp of timestamps) {
    if (!stamp) continue;
    const ms = new Date(stamp).getTime();
    if (Number.isNaN(ms) || ms < cutoffMs) continue;
    const key = weekKey(stamp);
    if (key) weeks.add(key);
  }

  return weeks.size;
}

export async function gatherBuilderScoreInputs(
  userId: string,
  progressStats: {
    projectsCompleted: number;
    roadmapsCompleted: number;
  },
): Promise<BuilderScoreInputs> {
  if (!isDatabaseConfigured()) {
    return {
      projectsCompleted: progressStats.projectsCompleted,
      projectsApproved: 0,
      roadmapsCompleted: progressStats.roadmapsCompleted,
      openSourceContributions: 0,
      communityReviews: 0,
      activeWeeks: 0,
    };
  }

  const db = getDb();
  const windowStart = new Date();
  windowStart.setUTCDate(
    windowStart.getUTCDate() - CONSISTENCY_WINDOW_WEEKS * 7,
  );
  const windowIso = windowStart.toISOString();

  const [
    approvedRows,
    ossApprovedRows,
    mergedPrRows,
    reviewRows,
    progressDates,
    xpDates,
    submissionDates,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.userId, userId),
          eq(projectSubmissions.status, "approved"),
        ),
      ),
    db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.userId, userId),
          eq(projectSubmissions.status, "approved"),
          sql`${projectSubmissions.prUrl} is not null and ${projectSubmissions.prUrl} <> ''`,
        ),
      ),
    db
      .select({ value: count() })
      .from(xpEvents)
      .where(
        and(eq(xpEvents.userId, userId), eq(xpEvents.sourceType, "merged_pr")),
      ),
    db
      .select({ value: count() })
      .from(submissionReviewEvents)
      .innerJoin(
        projectSubmissions,
        eq(submissionReviewEvents.submissionId, projectSubmissions.id),
      )
      .where(
        and(
          eq(submissionReviewEvents.actorUserId, userId),
          ne(projectSubmissions.userId, userId),
        ),
      ),
    db
      .select({ completedAt: userRoadmapProgress.completedAt })
      .from(userRoadmapProgress)
      .where(
        and(
          eq(userRoadmapProgress.userId, userId),
          eq(userRoadmapProgress.status, "completed"),
          gte(userRoadmapProgress.completedAt, windowIso),
        ),
      ),
    db
      .select({ createdAt: xpEvents.createdAt })
      .from(xpEvents)
      .where(and(eq(xpEvents.userId, userId), gte(xpEvents.createdAt, windowIso))),
    db
      .select({ submittedAt: projectSubmissions.submittedAt })
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.userId, userId),
          gte(projectSubmissions.submittedAt, windowIso),
        ),
      ),
  ]);

  const projectsApproved = Number(approvedRows[0]?.value ?? 0);
  const openSourceContributions =
    Number(ossApprovedRows[0]?.value ?? 0) + Number(mergedPrRows[0]?.value ?? 0);
  const communityReviews = Number(reviewRows[0]?.value ?? 0);

  const activeWeeks = countActiveWeeks([
    ...progressDates.map((row) => row.completedAt),
    ...xpDates.map((row) => row.createdAt),
    ...submissionDates.map((row) => row.submittedAt),
  ]);

  return {
    projectsCompleted: progressStats.projectsCompleted,
    projectsApproved,
    roadmapsCompleted: progressStats.roadmapsCompleted,
    openSourceContributions,
    communityReviews,
    activeWeeks,
  };
}
