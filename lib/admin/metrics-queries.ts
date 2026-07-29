import { and, count, desc, eq, gt, gte, inArray, isNotNull, lte, ne, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  githubConnections,
  projectSubmissions,
  userChapterQuizzes,
  userRoadmapProgress,
  users,
} from "@/lib/db/schema";
import { REVIEW_QUEUE_STATUSES } from "@/types/submission";

import { isAdminDemoUsername } from "./demo-accounts";

export async function countRegisteredUsers(since?: string | null): Promise<number> {
  const db = getDb();
  const where = since ? gte(users.createdAt, since) : undefined;

  const rows = await db.select({ value: count() }).from(users).where(where);
  return rows[0]?.value ?? 0;
}

export async function countDistinctLessonCompleters(
  since?: string | null,
): Promise<number> {
  const db = getDb();
  const conditions = [eq(userRoadmapProgress.status, "completed")];
  if (since) {
    conditions.push(gte(userRoadmapProgress.completedAt, since));
  }

  const rows = await db
    .select({
      value: sql<number>`count(distinct ${userRoadmapProgress.userId})::int`,
    })
    .from(userRoadmapProgress)
    .where(and(...conditions));

  return rows[0]?.value ?? 0;
}

export async function countDistinctQuizPassers(
  since?: string | null,
): Promise<number> {
  const db = getDb();
  const conditions = [eq(userChapterQuizzes.status, "passed")];
  if (since) {
    conditions.push(gte(userChapterQuizzes.completedAt, since));
  }

  const rows = await db
    .select({
      value: sql<number>`count(distinct ${userChapterQuizzes.userId})::int`,
    })
    .from(userChapterQuizzes)
    .where(and(...conditions));

  return rows[0]?.value ?? 0;
}

export async function countDistinctProjectSubmitters(
  since?: string | null,
): Promise<number> {
  const db = getDb();
  const conditions = [ne(projectSubmissions.status, "draft")];
  if (since) {
    conditions.push(
      isNotNull(projectSubmissions.submittedAt),
      gte(projectSubmissions.submittedAt, since),
    );
  }

  const rows = await db
    .select({
      value: sql<number>`count(distinct ${projectSubmissions.userId})::int`,
    })
    .from(projectSubmissions)
    .where(and(...conditions));

  return rows[0]?.value ?? 0;
}

export async function countReviewHealthStats(nowIso: string) {
  const db = getDb();
  const queueFilter = inArray(projectSubmissions.status, REVIEW_QUEUE_STATUSES);

  const [
    submittedRows,
    underReviewRows,
    needsChangesRows,
    activeClaimRows,
    stuckClaimRows,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.status, "submitted")),
    db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.status, "under_review")),
    db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.status, "needs_changes")),
    db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(
        and(
          queueFilter,
          isNotNull(projectSubmissions.claimedBy),
          isNotNull(projectSubmissions.claimExpiresAt),
          gt(projectSubmissions.claimExpiresAt, nowIso),
        ),
      ),
    db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(
        and(
          queueFilter,
          isNotNull(projectSubmissions.claimedBy),
          isNotNull(projectSubmissions.claimExpiresAt),
          lte(projectSubmissions.claimExpiresAt, nowIso),
        ),
      ),
  ]);

  const submitted = submittedRows[0]?.value ?? 0;
  const underReview = underReviewRows[0]?.value ?? 0;
  const needsChanges = needsChangesRows[0]?.value ?? 0;

  return {
    submitted,
    underReview,
    needsChanges,
    openTotal: submitted + underReview + needsChanges,
    activeClaims: activeClaimRows[0]?.value ?? 0,
    stuckClaims: stuckClaimRows[0]?.value ?? 0,
  };
}

export async function countMonthlyActiveUsers(sinceIso: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(users)
    .where(and(isNotNull(users.lastActiveAt), gte(users.lastActiveAt, sinceIso)));

  return rows[0]?.value ?? 0;
}

export async function fetchCronSyncHealth() {
  const db = getDb();

  const [aggregate, errorRows] = await Promise.all([
    db
      .select({
        lastSyncedAt: sql<string | null>`max(${githubConnections.lastSyncedAt})`,
        errorCount: sql<number>`count(*) filter (where ${githubConnections.syncStatus} = 'error')::int`,
      })
      .from(githubConnections),
    db
      .select({ syncError: githubConnections.syncError })
      .from(githubConnections)
      .where(eq(githubConnections.syncStatus, "error"))
      .orderBy(desc(githubConnections.updatedAt))
      .limit(5),
  ]);

  return {
    lastSyncedAt: aggregate[0]?.lastSyncedAt ?? null,
    errorCount: aggregate[0]?.errorCount ?? 0,
    recentErrors: errorRows
      .map((row) => row.syncError)
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 180)),
  };
}

export async function fetchLessonDropOff(limit = 10) {
  const db = getDb();

  const rows = await db
    .select({
      roadmapSlug: userRoadmapProgress.roadmapSlug,
      nodeSlug: userRoadmapProgress.nodeSlug,
      completed: sql<number>`count(distinct ${userRoadmapProgress.userId})::int`,
    })
    .from(userRoadmapProgress)
    .where(eq(userRoadmapProgress.status, "completed"))
    .groupBy(userRoadmapProgress.roadmapSlug, userRoadmapProgress.nodeSlug)
    .orderBy(sql`count(distinct ${userRoadmapProgress.userId}) asc`)
    .limit(limit);

  return rows.map((row) => ({
    roadmapSlug: row.roadmapSlug,
    nodeSlug: row.nodeSlug,
    started: row.completed,
    completed: row.completed,
    dropOff: 0,
    dropOffRate: 0,
  }));
}

export function filterDemoSubmissions<
  T extends { builderUsername?: string | null },
>(items: T[]): T[] {
  return items.filter(
    (item) => !isAdminDemoUsername(item.builderUsername ?? ""),
  );
}
