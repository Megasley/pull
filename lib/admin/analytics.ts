import {
  countDistinctLessonCompleters,
  countDistinctProjectSubmitters,
  countDistinctQuizPassers,
  countRegisteredUsers,
  fetchLessonDropOff,
} from "@/lib/admin/metrics-queries";
import { withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";

export type FunnelMetrics = {
  registeredUsers: number;
  completedLessonUsers: number;
  passedQuizUsers: number;
  submittedProjectUsers: number;
  /** Deferred on the request path — heavy github_pull_requests scan. */
  firstOssViaPull: number | null;
};

export type LessonDropOff = {
  roadmapSlug: string;
  nodeSlug: string;
  started: number;
  completed: number;
  dropOff: number;
  dropOffRate: number;
};

export async function getLearningFunnel(
  range: "30d" | "all" = "all",
): Promise<FunnelMetrics> {
  const empty: FunnelMetrics = {
    registeredUsers: 0,
    completedLessonUsers: 0,
    passedQuizUsers: 0,
    submittedProjectUsers: 0,
    firstOssViaPull: null,
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  const since =
    range === "30d"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  try {
    const [
      registeredUsers,
      completedLessonUsers,
      passedQuizUsers,
      submittedProjectUsers,
    ] = await withDbRetry(async () =>
      Promise.all([
        countRegisteredUsers(since),
        countDistinctLessonCompleters(since),
        countDistinctQuizPassers(since),
        countDistinctProjectSubmitters(since),
      ]),
    );

    return {
      registeredUsers,
      completedLessonUsers,
      passedQuizUsers,
      submittedProjectUsers,
      // Keep First OSS off the critical path — it previously timed out /admin.
      firstOssViaPull: null,
    };
  } catch (error) {
    console.warn("[admin] getLearningFunnel failed", error);
    return empty;
  }
}

export async function getLessonDropOff(limit = 10): Promise<LessonDropOff[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    return await withDbRetry(() => fetchLessonDropOff(limit));
  } catch (error) {
    console.warn("[admin] getLessonDropOff failed", error);
    return [];
  }
}

export async function getUserSubmissionsForAdmin(userId: string, limit = 10) {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = (await import("@/lib/db")).getDb();
  const { projectSubmissions, projects } = await import("@/lib/db/schema");
  const { desc, eq } = await import("drizzle-orm");

  const rows = await db
    .select({
      id: projectSubmissions.id,
      status: projectSubmissions.status,
      submittedAt: projectSubmissions.submittedAt,
      projectSlug: projects.slug,
      projectTitle: projects.title,
      repoUrl: projectSubmissions.repoUrl,
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .where(eq(projectSubmissions.userId, userId))
    .orderBy(desc(projectSubmissions.updatedAt))
    .limit(limit);

  return rows;
}

export async function getUserGithubSyncForAdmin(userId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = (await import("@/lib/db")).getDb();
  const { githubConnections } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const rows = await db
    .select({
      syncStatus: githubConnections.syncStatus,
      lastSyncedAt: githubConnections.lastSyncedAt,
      syncError: githubConnections.syncError,
      login: githubConnections.login,
    })
    .from(githubConnections)
    .where(eq(githubConnections.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}
