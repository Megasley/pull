import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  min,
  or,
} from "drizzle-orm";

import { getAllDiscoveryRepositories } from "@/lib/discovery/catalog";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { githubPullRequests, projectSubmissions, users } from "@/lib/db/schema";
import { getAllProjects } from "@/lib/projects/catalog";
import type { SubmissionStatus, UserRole } from "@/types/submission";
import { REVIEW_QUEUE_STATUSES } from "@/types/submission";

export type AdminUserRecord = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  githubUsername: string;
  role: UserRole;
  xp: number;
  level: number;
  createdAt: string;
};

export type ReviewHealth = {
  submitted: number;
  underReview: number;
  needsChanges: number;
  openTotal: number;
  activeClaims: number;
  stuckClaims: number;
};

export type PlatformMetrics = {
  registeredUsers: number;
  monthlyActiveUsers: number;
  projectsListed: number;
  firstOssViaPull: number;
};

export type UpdateUserRoleResult =
  | { ok: true; user: AdminUserRecord }
  | {
      ok: false;
      reason:
        | "database_unconfigured"
        | "not_found"
        | "last_admin"
        | "self_demote";
    };

function mapAdminUser(row: typeof users.$inferSelect): AdminUserRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatar: row.avatar,
    githubUsername: row.githubUsername,
    role: row.role,
    xp: row.xp,
    level: row.level,
    createdAt: row.createdAt,
  };
}

export async function listUsersForAdmin(input?: {
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUserRecord[]; total: number }> {
  if (!isDatabaseConfigured()) {
    return { users: [], total: 0 };
  }

  const db = getDb();
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 100);
  const offset = Math.max(input?.offset ?? 0, 0);
  const query = input?.query?.trim();

  const where = query
    ? or(
        ilike(users.username, `%${query}%`),
        ilike(users.displayName, `%${query}%`),
        ilike(users.githubUsername, `%${query}%`),
      )
    : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(users).where(where),
  ]);

  return {
    users: rows.map(mapAdminUser),
    total: totalRows[0]?.value ?? 0,
  };
}

export async function countAdmins(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "admin"));

  return rows[0]?.value ?? 0;
}

export async function updateUserRole(input: {
  userId: string;
  role: UserRole;
  actorUserId: string;
}): Promise<UpdateUserRoleResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database_unconfigured" };
  }

  const db = getDb();
  const existingRows = await db
    .select()
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  const existing = existingRows[0];
  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (
    input.userId === input.actorUserId &&
    existing.role === "admin" &&
    input.role !== "admin"
  ) {
    return { ok: false, reason: "self_demote" };
  }

  if (existing.role === "admin" && input.role !== "admin") {
    const admins = await countAdmins();
    if (admins <= 1) {
      return { ok: false, reason: "last_admin" };
    }
  }

  if (existing.role === input.role) {
    return { ok: true, user: mapAdminUser(existing) };
  }

  const [updated] = await db
    .update(users)
    .set({
      role: input.role,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, input.userId))
    .returning();

  if (!updated) {
    return { ok: false, reason: "not_found" };
  }

  if (input.role === "reviewer" || input.role === "admin") {
    const { notifyRoleGrantedAsync } = await import(
      "@/lib/notifications/dispatch"
    );
    notifyRoleGrantedAsync({
      userId: input.userId,
      role: input.role,
    });
  }

  return { ok: true, user: mapAdminUser(updated) };
}

async function countByStatus(status: SubmissionStatus): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(projectSubmissions)
    .where(eq(projectSubmissions.status, status));

  return rows[0]?.value ?? 0;
}

export async function getReviewHealth(): Promise<ReviewHealth> {
  if (!isDatabaseConfigured()) {
    return {
      submitted: 0,
      underReview: 0,
      needsChanges: 0,
      openTotal: 0,
      activeClaims: 0,
      stuckClaims: 0,
    };
  }

  const db = getDb();
  const now = new Date().toISOString();

  const [submitted, underReview, needsChanges, activeClaimsRows, stuckClaimsRows] =
    await Promise.all([
      countByStatus("submitted"),
      countByStatus("under_review"),
      countByStatus("needs_changes"),
      db
        .select({ value: count() })
        .from(projectSubmissions)
        .where(
          and(
            inArray(projectSubmissions.status, REVIEW_QUEUE_STATUSES),
            isNotNull(projectSubmissions.claimedBy),
            isNotNull(projectSubmissions.claimExpiresAt),
            gt(projectSubmissions.claimExpiresAt, now),
          ),
        ),
      db
        .select({ value: count() })
        .from(projectSubmissions)
        .where(
          and(
            inArray(projectSubmissions.status, REVIEW_QUEUE_STATUSES),
            isNotNull(projectSubmissions.claimedBy),
            isNotNull(projectSubmissions.claimExpiresAt),
            lte(projectSubmissions.claimExpiresAt, now),
          ),
        ),
    ]);

  return {
    submitted,
    underReview,
    needsChanges,
    openTotal: submitted + underReview + needsChanges,
    activeClaims: activeClaimsRows[0]?.value ?? 0,
    stuckClaims: stuckClaimsRows[0]?.value ?? 0,
  };
}

export async function countUsersByRole(): Promise<Record<UserRole, number>> {
  if (!isDatabaseConfigured()) {
    return { builder: 0, reviewer: 0, admin: 0 };
  }

  const db = getDb();
  const rows = await db
    .select({
      role: users.role,
      value: count(),
    })
    .from(users)
    .groupBy(users.role);

  const result: Record<UserRole, number> = {
    builder: 0,
    reviewer: 0,
    admin: 0,
  };

  for (const row of rows) {
    result[row.role] = row.value;
  }

  return result;
}

/**
 * First OSS via Pull: builders whose earliest synced merged PR landed after
 * signup, into a repository listed in Discover.
 */
export async function countFirstOssViaPull(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  const catalogRepos = getAllDiscoveryRepositories().map(
    (repo) => repo.repository,
  );
  if (catalogRepos.length === 0) {
    return 0;
  }

  const db = getDb();

  const earliestMerged = db
    .select({
      userId: githubPullRequests.userId,
      firstMergedAt: min(githubPullRequests.githubMergedAt).as(
        "first_merged_at",
      ),
    })
    .from(githubPullRequests)
    .where(
      and(
        eq(githubPullRequests.merged, true),
        isNotNull(githubPullRequests.githubMergedAt),
      ),
    )
    .groupBy(githubPullRequests.userId)
    .as("earliest_merged");

  const rows = await db
    .select({ value: countDistinct(users.id) })
    .from(earliestMerged)
    .innerJoin(users, eq(users.id, earliestMerged.userId))
    .innerJoin(
      githubPullRequests,
      and(
        eq(githubPullRequests.userId, earliestMerged.userId),
        eq(githubPullRequests.merged, true),
        eq(githubPullRequests.githubMergedAt, earliestMerged.firstMergedAt),
        inArray(githubPullRequests.repoFullName, catalogRepos),
      ),
    )
    .where(
      and(
        isNotNull(earliestMerged.firstMergedAt),
        gte(earliestMerged.firstMergedAt, users.createdAt),
      ),
    );

  return rows[0]?.value ?? 0;
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const projectsListed = getAllProjects().length;

  if (!isDatabaseConfigured()) {
    return {
      registeredUsers: 0,
      monthlyActiveUsers: 0,
      projectsListed,
      firstOssViaPull: 0,
    };
  }

  const db = getDb();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [registeredRows, mauRows, firstOssViaPull] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(
        and(
          isNotNull(users.lastActiveAt),
          gte(users.lastActiveAt, thirtyDaysAgo),
        ),
      ),
    countFirstOssViaPull(),
  ]);

  return {
    registeredUsers: registeredRows[0]?.value ?? 0,
    monthlyActiveUsers: mauRows[0]?.value ?? 0,
    projectsListed,
    firstOssViaPull,
  };
}
