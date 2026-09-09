import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { recordAdminAction } from "@/lib/admin/audit-log";
import {
  countMonthlyActiveUsers,
  countRegisteredUsers,
  countReviewHealthStats,
  fetchCronSyncHealth,
} from "@/lib/admin/metrics-queries";
import { withTimeout } from "@/lib/async/with-timeout";
import { getAllDiscoveryRepositories } from "@/lib/discovery/catalog";
import { getDb, getPostgresClient, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { projectSubmissions, projects, users } from "@/lib/db/schema";
import { getAllProjects } from "@/lib/projects/catalog";
import type { SubmissionStatus, UserRole } from "@/types/submission";

/** Soft budget so /admin never burns a full Vercel function timeout. */
const ADMIN_QUERY_BUDGET_MS = 4_000;

/** Serialize mutations that can reduce the active-admin set. */
const LAST_ACTIVE_ADMIN_LOCK = sql`
  SELECT pg_advisory_xact_lock(hashtext('pull:last-active-admin'))
`;

export type AdminUserRecord = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  githubUsername: string;
  role: UserRole;
  accountStatus: "active" | "suspended" | "banned";
  moderationReason: string | null;
  moderatedAt: string | null;
  onboardingCompletedAt: string | null;
  preferredRoadmapSlug: string | null;
  country: string | null;
  acquisitionSource: string | null;
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
  /** Deferred on the request path — heavy github_pull_requests scan. */
  firstOssViaPull: number | null;
};

export type UpdateUserRoleResult =
  | { ok: true; user: AdminUserRecord }
  | {
      ok: false;
      reason: "database_unconfigured" | "not_found" | "last_admin" | "self_demote";
    };

function mapAdminUser(row: typeof users.$inferSelect): AdminUserRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatar: row.avatar,
    githubUsername: row.githubUsername,
    role: row.role,
    accountStatus: row.accountStatus,
    moderationReason: row.moderationReason,
    moderatedAt: row.moderatedAt,
    onboardingCompletedAt: row.onboardingCompletedAt,
    preferredRoadmapSlug: row.preferredRoadmapSlug,
    country: row.country,
    acquisitionSource: row.acquisitionSource,
    xp: row.xp,
    level: row.level,
    createdAt: row.createdAt,
  };
}

export type AdminSubmissionRecord = {
  id: string;
  userId: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  updatedAt: string;
  projectSlug: string;
  projectTitle: string;
  builderUsername: string;
  builderDisplayName: string;
  repoUrl: string | null;
};

export async function listRecentSubmissionsForAdmin(
  limit = 25,
): Promise<AdminSubmissionRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      id: projectSubmissions.id,
      userId: projectSubmissions.userId,
      status: projectSubmissions.status,
      submittedAt: projectSubmissions.submittedAt,
      updatedAt: projectSubmissions.updatedAt,
      projectSlug: projects.slug,
      projectTitle: projects.title,
      builderUsername: users.username,
      builderDisplayName: users.displayName,
      repoUrl: projectSubmissions.repoUrl,
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .innerJoin(users, eq(projectSubmissions.userId, users.id))
    .where(sql`lower(${users.username}) <> 'satoshee'`)
    .orderBy(desc(projectSubmissions.updatedAt))
    .limit(limit);

  return rows;
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
  const outcome = await db.transaction(async (transaction) => {
    await transaction.execute(LAST_ACTIVE_ADMIN_LOCK);

    const existingRows = await transaction
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    const existing = existingRows[0];
    if (!existing) {
      return { ok: false as const, reason: "not_found" as const };
    }

    if (
      input.userId === input.actorUserId &&
      existing.role === "admin" &&
      input.role !== "admin"
    ) {
      return { ok: false as const, reason: "self_demote" as const };
    }

    if (
      existing.role === "admin" &&
      existing.accountStatus === "active" &&
      input.role !== "admin"
    ) {
      const adminRows = await transaction
        .select({ value: count() })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.accountStatus, "active")));

      if ((adminRows[0]?.value ?? 0) <= 1) {
        return { ok: false as const, reason: "last_admin" as const };
      }
    }

    if (existing.role === input.role) {
      return { ok: true as const, user: existing, changed: false as const };
    }

    const [updated] = await transaction
      .update(users)
      .set({
        role: input.role,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, input.userId))
      .returning();

    if (!updated) {
      return { ok: false as const, reason: "not_found" as const };
    }

    return {
      ok: true as const,
      user: updated,
      changed: true as const,
      previousRole: existing.role,
    };
  });

  if (!outcome.ok) {
    return outcome;
  }

  if (!outcome.changed) {
    return { ok: true, user: mapAdminUser(outcome.user) };
  }

  await recordAdminAction({
    actorUserId: input.actorUserId,
    targetUserId: input.userId,
    action: "role_change",
    metadata: {
      from: outcome.previousRole,
      to: input.role,
    },
  });

  if (input.role === "reviewer" || input.role === "admin") {
    const { notifyRoleGrantedAsync } = await import("@/lib/notifications/dispatch");
    notifyRoleGrantedAsync({
      userId: input.userId,
      role: input.role,
    });
  }

  return { ok: true, user: mapAdminUser(outcome.user) };
}

export async function getReviewHealth(): Promise<ReviewHealth> {
  const empty: ReviewHealth = {
    submitted: 0,
    underReview: 0,
    needsChanges: 0,
    openTotal: 0,
    activeClaims: 0,
    stuckClaims: 0,
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  try {
    return await withDbRetry(async () =>
      countReviewHealthStats(new Date().toISOString()),
    );
  } catch (error) {
    console.warn("[admin] getReviewHealth failed", error);
    return empty;
  }
}

export async function countUsersByRole(): Promise<Record<UserRole, number>> {
  const empty: Record<UserRole, number> = {
    builder: 0,
    reviewer: 0,
    admin: 0,
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  try {
    return await withTimeout(
      withDbRetry(async () => {
        const db = getDb();
        const rows = await db
          .select({
            role: users.role,
            value: count(),
          })
          .from(users)
          .groupBy(users.role);

        const result: Record<UserRole, number> = { ...empty };
        for (const row of rows) {
          result[row.role] = row.value;
        }
        return result;
      }),
      ADMIN_QUERY_BUDGET_MS,
      empty,
      "countUsersByRole",
    );
  } catch (error) {
    console.warn("[admin] countUsersByRole failed", error);
    return empty;
  }
}

/**
 * First OSS via Pull: builders whose earliest synced merged PR landed after
 * signup, into a repository listed in Discover.
 *
 * Not awaited on the critical /admin path — it previously caused
 * FUNCTION_INVOCATION_TIMEOUT when github_pull_requests grew.
 */
export async function countFirstOssViaPull(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  const catalogRepos = getAllDiscoveryRepositories().map((repo) => repo.repository);
  if (catalogRepos.length === 0) {
    return 0;
  }

  try {
    return await withTimeout(
      withDbRetry(async () => {
        const sql = getPostgresClient();
        const rows = await sql.begin(async (tx) => {
          await tx`SELECT set_config('statement_timeout', '2500', true)`;
          return tx<{ value: number }[]>`
            SELECT COUNT(*)::int AS value
            FROM (
              SELECT DISTINCT ON (pr.user_id)
                pr.user_id,
                pr.github_merged_at,
                pr.repo_full_name
              FROM github_pull_requests pr
              WHERE pr.merged = true
                AND pr.github_merged_at IS NOT NULL
              ORDER BY pr.user_id, pr.github_merged_at ASC
            ) first_pr
            INNER JOIN users u ON u.id = first_pr.user_id
            WHERE first_pr.github_merged_at >= u.created_at
              AND first_pr.repo_full_name = ANY(${catalogRepos})
          `;
        });
        return rows[0]?.value ?? 0;
      }),
      3_000,
      0,
      "countFirstOssViaPull",
    );
  } catch (error) {
    console.warn("[admin] countFirstOssViaPull failed", error);
    return 0;
  }
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const projectsListed = getAllProjects().length;
  const empty: PlatformMetrics = {
    registeredUsers: 0,
    monthlyActiveUsers: 0,
    projectsListed,
    firstOssViaPull: null,
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [registeredUsers, monthlyActiveUsers] = await withDbRetry(async () =>
      Promise.all([countRegisteredUsers(), countMonthlyActiveUsers(thirtyDaysAgo)]),
    );

    return {
      registeredUsers,
      monthlyActiveUsers,
      projectsListed,
      firstOssViaPull: null,
    };
  } catch (error) {
    console.warn("[admin] getPlatformMetrics failed", error);
    return empty;
  }
}

export type ModerationResult =
  | { ok: true; user: AdminUserRecord }
  | {
      ok: false;
      reason:
        | "database_unconfigured"
        | "not_found"
        | "invalid_status"
        | "last_admin"
        | "self_moderation";
    };

async function applyModeration(input: {
  userId: string;
  actorUserId: string;
  action: "suspend" | "ban" | "restore";
  reason?: string;
}): Promise<ModerationResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database_unconfigured" };
  }

  const db = getDb();
  const outcome = await db.transaction(async (transaction) => {
    await transaction.execute(LAST_ACTIVE_ADMIN_LOCK);

    const existingRows = await transaction
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    const existing = existingRows[0];
    if (!existing) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const disablesAccount = input.action === "suspend" || input.action === "ban";
    if (disablesAccount && existing.role === "admin") {
      if (input.userId === input.actorUserId) {
        return { ok: false as const, reason: "self_moderation" as const };
      }

      if (existing.accountStatus === "active") {
        const adminRows = await transaction
          .select({ value: count() })
          .from(users)
          .where(and(eq(users.role, "admin"), eq(users.accountStatus, "active")));

        if ((adminRows[0]?.value ?? 0) <= 1) {
          return { ok: false as const, reason: "last_admin" as const };
        }
      }
    }

    const now = new Date().toISOString();
    const patch =
      input.action === "restore"
        ? {
            accountStatus: "active" as const,
            moderationReason: null,
            moderatedAt: null,
            moderatedBy: null,
            updatedAt: now,
          }
        : {
            accountStatus:
              input.action === "ban" ? ("banned" as const) : ("suspended" as const),
            moderationReason: input.reason?.trim() || null,
            moderatedAt: now,
            moderatedBy: input.actorUserId,
            updatedAt: now,
          };

    const [updatedUser] = await transaction
      .update(users)
      .set(patch)
      .where(eq(users.id, input.userId))
      .returning();

    if (updatedUser && disablesAccount) {
      await transaction.execute(sql`
        DELETE FROM auth.sessions
        WHERE user_id = ${input.userId}::uuid
      `);
    }

    if (!updatedUser) {
      return { ok: false as const, reason: "not_found" as const };
    }

    return {
      ok: true as const,
      user: updatedUser,
      previousStatus: existing.accountStatus,
    };
  });

  if (!outcome.ok) {
    return outcome;
  }

  await recordAdminAction({
    actorUserId: input.actorUserId,
    targetUserId: input.userId,
    action: input.action,
    metadata: {
      reason: input.reason?.trim() || null,
      previousStatus: outcome.previousStatus,
    },
  });

  return { ok: true, user: mapAdminUser(outcome.user) };
}

export async function suspendUser(input: {
  userId: string;
  actorUserId: string;
  reason?: string;
}) {
  return applyModeration({ ...input, action: "suspend" });
}

export async function banUser(input: {
  userId: string;
  actorUserId: string;
  reason?: string;
}) {
  return applyModeration({ ...input, action: "ban" });
}

export async function restoreUser(input: { userId: string; actorUserId: string }) {
  return applyModeration({ ...input, action: "restore" });
}

export type CronSyncHealth = {
  lastSyncedAt: string | null;
  errorCount: number;
  recentErrors: string[];
};

export async function getCronSyncHealth(): Promise<CronSyncHealth> {
  const empty: CronSyncHealth = {
    lastSyncedAt: null,
    errorCount: 0,
    recentErrors: [],
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  try {
    return await withDbRetry(fetchCronSyncHealth);
  } catch (error) {
    console.warn("[admin] getCronSyncHealth failed", error);
    return empty;
  }
}

export async function getAdminUserById(
  userId: string,
): Promise<AdminUserRecord | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ? mapAdminUser(rows[0]) : null;
}
