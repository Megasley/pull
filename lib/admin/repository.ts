import {
  count,
  desc,
  eq,
  ilike,
  or,
} from "drizzle-orm";

import { withTimeout } from "@/lib/async/with-timeout";
import { getAllDiscoveryRepositories } from "@/lib/discovery/catalog";
import { getDb, getPostgresClient, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users } from "@/lib/db/schema";
import { getAllProjects } from "@/lib/projects/catalog";
import type { UserRole } from "@/types/submission";
import { REVIEW_QUEUE_STATUSES } from "@/types/submission";

/** Soft budget so /admin never burns a full Vercel function timeout. */
const ADMIN_QUERY_BUDGET_MS = 4_000;

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

  const now = new Date().toISOString();
  const statuses = [...REVIEW_QUEUE_STATUSES];

  try {
    return await withTimeout(
      withDbRetry(async () => {
        const sql = getPostgresClient();
        const rows = await sql.begin(async (tx) => {
          await tx`SELECT set_config('statement_timeout', '3000', true)`;
          return tx<{
            submitted: number;
            under_review: number;
            needs_changes: number;
            active_claims: number;
            stuck_claims: number;
          }[]>`
            SELECT
              COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
              COUNT(*) FILTER (WHERE status = 'under_review')::int AS under_review,
              COUNT(*) FILTER (WHERE status = 'needs_changes')::int AS needs_changes,
              COUNT(*) FILTER (
                WHERE claimed_by IS NOT NULL
                  AND claim_expires_at IS NOT NULL
                  AND claim_expires_at > ${now}
              )::int AS active_claims,
              COUNT(*) FILTER (
                WHERE claimed_by IS NOT NULL
                  AND claim_expires_at IS NOT NULL
                  AND claim_expires_at <= ${now}
              )::int AS stuck_claims
            FROM project_submissions
            WHERE status = ANY(${statuses}::text[])
          `;
        });

        const row = rows[0];
        const submitted = row?.submitted ?? 0;
        const underReview = row?.under_review ?? 0;
        const needsChanges = row?.needs_changes ?? 0;

        return {
          submitted,
          underReview,
          needsChanges,
          openTotal: submitted + underReview + needsChanges,
          activeClaims: row?.active_claims ?? 0,
          stuckClaims: row?.stuck_claims ?? 0,
        };
      }),
      ADMIN_QUERY_BUDGET_MS,
      empty,
      "getReviewHealth",
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

  const catalogRepos = getAllDiscoveryRepositories().map(
    (repo) => repo.repository,
  );
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
    firstOssViaPull: 0,
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const counts = await withTimeout(
      withDbRetry(async () => {
        const sql = getPostgresClient();
        return sql.begin(async (tx) => {
          await tx`SELECT set_config('statement_timeout', '3000', true)`;
          return tx<{ registered: number; mau: number }[]>`
            SELECT
              COUNT(*)::int AS registered,
              COUNT(*) FILTER (
                WHERE last_active_at IS NOT NULL
                  AND last_active_at >= ${thirtyDaysAgo}
              )::int AS mau
            FROM users
          `;
        });
      }),
      ADMIN_QUERY_BUDGET_MS,
      null,
      "getPlatformMetrics.counts",
    );

    return {
      registeredUsers: counts?.[0]?.registered ?? 0,
      monthlyActiveUsers: counts?.[0]?.mau ?? 0,
      projectsListed,
      // Expensive join — skip on page render; show 0 rather than timing out /admin.
      firstOssViaPull: 0,
    };
  } catch (error) {
    console.warn("[admin] getPlatformMetrics failed", error);
    return empty;
  }
}
