import { count, eq } from "drizzle-orm";

import {
  countDistinctLessonCompleters,
  countDistinctProjectSubmitters,
  countDistinctQuizPassers,
  countMonthlyActiveUsers,
  countRegisteredUsers,
  fetchLessonDropOff,
} from "@/lib/admin/metrics-queries";
import type { FunnelMetrics, LessonDropOff } from "@/lib/admin/analytics";
import type { PlatformMetrics } from "@/lib/admin/repository";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { adminMetricsSnapshots, users } from "@/lib/db/schema";
import { getAllProjects } from "@/lib/projects/catalog";
import type { UserRole } from "@/types/submission";

export const ADMIN_METRICS_SNAPSHOT_ID = "overview";

/** Treat snapshot as stale after ~36h (missed a daily cron). */
export const ADMIN_METRICS_STALE_MS = 36 * 60 * 60 * 1000;

export type AdminMetricsSnapshotPayload = {
  version: 1;
  metrics: PlatformMetrics;
  funnelAll: FunnelMetrics;
  funnel30d: FunnelMetrics;
  dropOff: LessonDropOff[];
  roleCounts: Record<UserRole, number>;
};

export type AdminMetricsSnapshotView =
  | {
      status: "ok";
      computedAt: string;
      stale: boolean;
      payload: AdminMetricsSnapshotPayload;
    }
  | {
      status: "error";
      computedAt: string | null;
      stale: boolean;
      error: string;
      payload: AdminMetricsSnapshotPayload | null;
    }
  | {
      status: "missing";
    };

function emptyFunnel(): FunnelMetrics {
  return {
    registeredUsers: 0,
    completedLessonUsers: 0,
    passedQuizUsers: 0,
    submittedProjectUsers: 0,
    firstOssViaPull: null,
  };
}

function emptyRoles(): Record<UserRole, number> {
  return { builder: 0, reviewer: 0, admin: 0 };
}

function isPayload(value: unknown): value is AdminMetricsSnapshotPayload {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return obj.version === 1 && typeof obj.metrics === "object" && obj.metrics !== null;
}

async function settledNumber(
  label: string,
  fn: () => Promise<number>,
  fallback = 0,
): Promise<number> {
  try {
    return await fn();
  } catch (error) {
    console.warn(`[admin] snapshot metric failed: ${label}`, error);
    return fallback;
  }
}

async function buildFunnel(since: string | null): Promise<FunnelMetrics> {
  // Sequential so a missing optional table (e.g. quizzes) cannot wedge parallel
  // queries sharing a single pooled connection.
  const registeredUsers = await settledNumber("registeredUsers", () =>
    countRegisteredUsers(since),
  );
  const completedLessonUsers = await settledNumber("lessonCompleters", () =>
    countDistinctLessonCompleters(since),
  );
  const passedQuizUsers = await settledNumber("quizPassers", () =>
    countDistinctQuizPassers(since),
  );
  const submittedProjectUsers = await settledNumber("projectSubmitters", () =>
    countDistinctProjectSubmitters(since),
  );

  return {
    registeredUsers,
    completedLessonUsers,
    passedQuizUsers,
    submittedProjectUsers,
    firstOssViaPull: null,
  };
}

async function buildRoleCounts(): Promise<Record<UserRole, number>> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        role: users.role,
        value: count(),
      })
      .from(users)
      .groupBy(users.role);

    const result = emptyRoles();
    for (const row of rows) {
      result[row.role] = row.value;
    }
    return result;
  } catch (error) {
    console.warn("[admin] snapshot roleCounts failed", error);
    return emptyRoles();
  }
}

/** Compute the full overview payload (runs on cron / manual refresh). */
export async function computeAdminMetricsSnapshotPayload(): Promise<AdminMetricsSnapshotPayload> {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const registeredUsers = await settledNumber("registeredUsers", () =>
    countRegisteredUsers(),
  );
  const monthlyActiveUsers = await settledNumber("monthlyActiveUsers", () =>
    countMonthlyActiveUsers(thirtyDaysAgo),
  );
  const funnelAll = await buildFunnel(null);
  const funnel30d = await buildFunnel(thirtyDaysAgo);
  const roleCounts = await buildRoleCounts();

  let dropOff: LessonDropOff[] = [];
  try {
    dropOff = await fetchLessonDropOff(10);
  } catch (error) {
    console.warn("[admin] snapshot dropOff failed", error);
  }

  // First OSS scans github_pull_requests inside a transaction. Timing it out
  // without cancelling the query can pin the pool connection and deadlock the
  // snapshot write — keep it deferred (null) until we have a cancellable path.
  const firstOssViaPull = null;

  const metrics: PlatformMetrics = {
    registeredUsers,
    monthlyActiveUsers,
    projectsListed: getAllProjects().length,
    firstOssViaPull,
  };

  return {
    version: 1,
    metrics,
    funnelAll: { ...funnelAll, firstOssViaPull },
    funnel30d: { ...funnel30d, firstOssViaPull },
    dropOff,
    roleCounts,
  };
}

export async function saveAdminMetricsSnapshot(input: {
  payload?: AdminMetricsSnapshotPayload;
  error?: string | null;
}): Promise<{ computedAt: string }> {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured");
  }

  const db = getDb();
  const computedAt = new Date().toISOString();
  const payload = input.payload ?? {
    version: 1 as const,
    metrics: {
      registeredUsers: 0,
      monthlyActiveUsers: 0,
      projectsListed: getAllProjects().length,
      firstOssViaPull: null,
    },
    funnelAll: emptyFunnel(),
    funnel30d: emptyFunnel(),
    dropOff: [] as LessonDropOff[],
    roleCounts: emptyRoles(),
  };

  await db
    .insert(adminMetricsSnapshots)
    .values({
      id: ADMIN_METRICS_SNAPSHOT_ID,
      computedAt,
      payload,
      error: input.error ?? null,
    })
    .onConflictDoUpdate({
      target: adminMetricsSnapshots.id,
      set: {
        computedAt,
        payload,
        error: input.error ?? null,
      },
    });

  return { computedAt };
}

/** Compute aggregates and persist. Returns computedAt or throws after recording error. */
export async function refreshAdminMetricsSnapshot(): Promise<{
  ok: boolean;
  computedAt: string;
  error?: string;
}> {
  if (!isDatabaseConfigured()) {
    return { ok: false, computedAt: new Date().toISOString(), error: "database_unconfigured" };
  }

  try {
    const payload = await computeAdminMetricsSnapshotPayload();
    const { computedAt } = await saveAdminMetricsSnapshot({ payload, error: null });
    return { ok: true, computedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "snapshot_failed";
    console.error("[admin] refreshAdminMetricsSnapshot failed", error);
    try {
      const { computedAt } = await saveAdminMetricsSnapshot({ error: message });
      return { ok: false, computedAt, error: message };
    } catch (persistError) {
      console.error("[admin] failed to persist snapshot error", persistError);
      return {
        ok: false,
        computedAt: new Date().toISOString(),
        error: message,
      };
    }
  }
}

export async function getAdminMetricsSnapshot(): Promise<AdminMetricsSnapshotView> {
  if (!isDatabaseConfigured()) {
    return { status: "missing" };
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(adminMetricsSnapshots)
      .where(eq(adminMetricsSnapshots.id, ADMIN_METRICS_SNAPSHOT_ID))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return { status: "missing" };
    }

    const ageMs = Date.now() - new Date(row.computedAt).getTime();
    const stale = !Number.isFinite(ageMs) || ageMs > ADMIN_METRICS_STALE_MS;
    const payload = isPayload(row.payload) ? row.payload : null;

    if (row.error) {
      return {
        status: "error",
        computedAt: row.computedAt,
        stale,
        error: row.error,
        payload,
      };
    }

    if (!payload) {
      return {
        status: "error",
        computedAt: row.computedAt,
        stale,
        error: "invalid_payload",
        payload: null,
      };
    }

    return {
      status: "ok",
      computedAt: row.computedAt,
      stale,
      payload,
    };
  } catch (error) {
    console.warn("[admin] getAdminMetricsSnapshot failed", error);
    return { status: "missing" };
  }
}
