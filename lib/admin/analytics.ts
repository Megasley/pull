import { withTimeout } from "@/lib/async/with-timeout";
import { getDb, getPostgresClient, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { countFirstOssViaPull } from "@/lib/admin/repository";

const ANALYTICS_BUDGET_MS = 4_000;

export type FunnelMetrics = {
  registeredUsers: number;
  completedLessonUsers: number;
  passedQuizUsers: number;
  submittedProjectUsers: number;
  firstOssViaPull: number;
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
  range: "30d" | "all" = "30d",
): Promise<FunnelMetrics> {
  const empty: FunnelMetrics = {
    registeredUsers: 0,
    completedLessonUsers: 0,
    passedQuizUsers: 0,
    submittedProjectUsers: 0,
    firstOssViaPull: 0,
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  const since =
    range === "30d"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  try {
    const [counts, firstOss] = await Promise.all([
      withTimeout(
        withDbRetry(async () => {
          const sql = getPostgresClient();
          return sql.begin(async (tx) => {
            await tx`SELECT set_config('statement_timeout', '3000', true)`;
            if (since) {
              return tx<{
                registered: number;
                lesson_users: number;
                quiz_users: number;
                submit_users: number;
              }[]>`
                SELECT
                  COUNT(*)::int AS registered,
                  (
                    SELECT COUNT(DISTINCT user_id)::int
                    FROM user_roadmap_progress
                    WHERE status = 'completed'
                      AND completed_at >= ${since}
                  ) AS lesson_users,
                  (
                    SELECT COUNT(DISTINCT user_id)::int
                    FROM user_chapter_quizzes
                    WHERE status = 'passed'
                      AND completed_at >= ${since}
                  ) AS quiz_users,
                  (
                    SELECT COUNT(DISTINCT user_id)::int
                    FROM project_submissions
                    WHERE status <> 'draft'
                      AND submitted_at >= ${since}
                  ) AS submit_users
                FROM users
                WHERE created_at >= ${since}
              `;
            }

            return tx<{
              registered: number;
              lesson_users: number;
              quiz_users: number;
              submit_users: number;
            }[]>`
              SELECT
                COUNT(*)::int AS registered,
                (
                  SELECT COUNT(DISTINCT user_id)::int
                  FROM user_roadmap_progress
                  WHERE status = 'completed'
                ) AS lesson_users,
                (
                  SELECT COUNT(DISTINCT user_id)::int
                  FROM user_chapter_quizzes
                  WHERE status = 'passed'
                ) AS quiz_users,
                (
                  SELECT COUNT(DISTINCT user_id)::int
                  FROM project_submissions
                  WHERE status <> 'draft'
                ) AS submit_users
              FROM users
            `;
          });
        }),
        ANALYTICS_BUDGET_MS,
        null,
        "getLearningFunnel",
      ),
      countFirstOssViaPull(),
    ]);

    const row = counts?.[0];
    return {
      registeredUsers: row?.registered ?? 0,
      completedLessonUsers: row?.lesson_users ?? 0,
      passedQuizUsers: row?.quiz_users ?? 0,
      submittedProjectUsers: row?.submit_users ?? 0,
      firstOssViaPull: firstOss,
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
    return await withTimeout(
      withDbRetry(async () => {
        const sql = getPostgresClient();
        const rows = await sql.begin(async (tx) => {
          await tx`SELECT set_config('statement_timeout', '3000', true)`;
          return tx<{
            roadmap_slug: string;
            node_slug: string;
            started: number;
            completed: number;
          }[]>`
            WITH lesson_stats AS (
              SELECT
                roadmap_slug,
                node_slug,
                COUNT(DISTINCT user_id)::int AS completed
              FROM user_roadmap_progress
              WHERE status = 'completed'
              GROUP BY roadmap_slug, node_slug
            )
            SELECT
              roadmap_slug,
              node_slug,
              completed AS started,
              completed
            FROM lesson_stats
            ORDER BY completed ASC
            LIMIT ${limit}
          `;
        });

        return rows.map((row) => {
          const started = row.started;
          const completed = row.completed;
          const dropOff = Math.max(0, started - completed);
          const dropOffRate = started > 0 ? dropOff / started : 0;
          return {
            roadmapSlug: row.roadmap_slug,
            nodeSlug: row.node_slug,
            started,
            completed,
            dropOff,
            dropOffRate,
          };
        });
      }),
      ANALYTICS_BUDGET_MS,
      [],
      "getLessonDropOff",
    );
  } catch (error) {
    console.warn("[admin] getLessonDropOff failed", error);
    return [];
  }
}

export async function getUserSubmissionsForAdmin(userId: string, limit = 10) {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
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
    .orderBy(desc(projectSubmissions.submittedAt))
    .limit(limit);

  return rows;
}

export async function getUserGithubSyncForAdmin(userId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
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
