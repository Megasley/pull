import { and, count, desc, eq, gte, lte } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  githubPullRequestEvents,
  milestoneEvents,
  opportunityEvents,
  users,
} from "@/lib/db/schema";
import type { MilestoneType } from "@/lib/milestones/types";

export type AdminActivitySummary = {
  newDevelopersToday: number;
  newDevelopersThisWeek: number;
  opportunitiesExploredToday: number;
  prsOpenedToday: number;
  prsSubmittedToday: number;
  prsMergedToday: number;
  milestonesAchievedToday: number;
};

/** "Today"/"this week" boundaries are computed by the caller (the admin
 *  activity page, in the server's local time) and passed in as ISO
 *  timestamps — keeps this function a plain, testable read. */
export async function getAdminActivitySummary(input: {
  todaySince: string;
  weekSince: string;
}): Promise<AdminActivitySummary> {
  if (!isDatabaseConfigured()) {
    return {
      newDevelopersToday: 0,
      newDevelopersThisWeek: 0,
      opportunitiesExploredToday: 0,
      prsOpenedToday: 0,
      prsSubmittedToday: 0,
      prsMergedToday: 0,
      milestonesAchievedToday: 0,
    };
  }

  const db = getDb();
  const { todaySince, weekSince } = input;

  const [
    newDevelopersToday,
    newDevelopersThisWeek,
    opportunitiesExploredToday,
    prsOpenedToday,
    prsSubmittedToday,
    prsMergedToday,
    milestonesAchievedToday,
  ] = await Promise.all([
    db.select({ value: count() }).from(users).where(gte(users.createdAt, todaySince)),
    db.select({ value: count() }).from(users).where(gte(users.createdAt, weekSince)),
    db
      .select({ value: count() })
      .from(opportunityEvents)
      .where(gte(opportunityEvents.createdAt, todaySince)),
    db
      .select({ value: count() })
      .from(githubPullRequestEvents)
      .where(
        and(
          eq(githubPullRequestEvents.eventType, "opened"),
          gte(githubPullRequestEvents.occurredAt, todaySince),
        ),
      ),
    db
      .select({ value: count() })
      .from(githubPullRequestEvents)
      .where(
        and(
          eq(githubPullRequestEvents.eventType, "ready_for_review"),
          gte(githubPullRequestEvents.occurredAt, todaySince),
        ),
      ),
    db
      .select({ value: count() })
      .from(githubPullRequestEvents)
      .where(
        and(
          eq(githubPullRequestEvents.eventType, "merged"),
          gte(githubPullRequestEvents.occurredAt, todaySince),
        ),
      ),
    db
      .select({ value: count() })
      .from(milestoneEvents)
      .where(gte(milestoneEvents.achievedAt, todaySince)),
  ]);

  return {
    newDevelopersToday: newDevelopersToday[0]?.value ?? 0,
    newDevelopersThisWeek: newDevelopersThisWeek[0]?.value ?? 0,
    opportunitiesExploredToday: opportunitiesExploredToday[0]?.value ?? 0,
    prsOpenedToday: prsOpenedToday[0]?.value ?? 0,
    prsSubmittedToday: prsSubmittedToday[0]?.value ?? 0,
    prsMergedToday: prsMergedToday[0]?.value ?? 0,
    milestonesAchievedToday: milestonesAchievedToday[0]?.value ?? 0,
  };
}

export type ActivityFeedItem = {
  id: string;
  milestoneType: MilestoneType;
  repository: string | null;
  pullRequestUrl: string | null;
  pullRequestNumber: number | null;
  achievedAt: string;
  userId: string;
  username: string;
  displayName: string;
};

export async function listActivityFeed(input?: {
  limit?: number;
  offset?: number;
  milestoneType?: MilestoneType;
  since?: string;
  until?: string;
}): Promise<{ items: ActivityFeedItem[]; total: number }> {
  if (!isDatabaseConfigured()) {
    return { items: [], total: 0 };
  }

  const db = getDb();
  const limit = Math.min(Math.max(input?.limit ?? 25, 1), 100);
  const offset = Math.max(input?.offset ?? 0, 0);

  const conditions = [
    input?.milestoneType ? eq(milestoneEvents.milestoneType, input.milestoneType) : undefined,
    input?.since ? gte(milestoneEvents.achievedAt, input.since) : undefined,
    input?.until ? lte(milestoneEvents.achievedAt, input.until) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: milestoneEvents.id,
      milestoneType: milestoneEvents.milestoneType,
      repository: milestoneEvents.repository,
      pullRequestUrl: milestoneEvents.pullRequestUrl,
      pullRequestNumber: milestoneEvents.pullRequestNumber,
      achievedAt: milestoneEvents.achievedAt,
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
    })
    .from(milestoneEvents)
    .innerJoin(users, eq(milestoneEvents.userId, users.id));

  const [rows, totalRows] = await Promise.all([
    query.where(where).orderBy(desc(milestoneEvents.achievedAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(milestoneEvents).where(where),
  ]);

  return {
    items: rows.map((row) => ({ ...row, milestoneType: row.milestoneType as MilestoneType })),
    total: totalRows[0]?.value ?? 0,
  };
}
