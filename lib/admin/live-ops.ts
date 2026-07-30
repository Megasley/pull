import { withTimeoutResult } from "@/lib/async/with-timeout";
import { withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  countReviewHealthStats,
  fetchCronSyncHealth,
  filterDemoSubmissions,
} from "@/lib/admin/metrics-queries";
import {
  listRecentSubmissionsForAdmin,
  type AdminSubmissionRecord,
  type CronSyncHealth,
  type ReviewHealth,
} from "@/lib/admin/repository";
import { listReviewQueue } from "@/lib/reviews/repository";
import type { ProjectSubmissionRecord } from "@/types/submission";

const LIVE_BUDGET_MS = 5_000;

export type LiveLoad<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable" };

export type AdminLiveOps = {
  health: LiveLoad<ReviewHealth>;
  cronHealth: LiveLoad<CronSyncHealth>;
  openQueue: LiveLoad<ProjectSubmissionRecord[]>;
  recentSubmissions: LiveLoad<AdminSubmissionRecord[]>;
};

async function settleLive<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<LiveLoad<T>> {
  if (!isDatabaseConfigured()) {
    return { status: "unavailable" };
  }

  const result = await withTimeoutResult(fn(), LIVE_BUDGET_MS, label);
  if (!result.ok) {
    return { status: "unavailable" };
  }
  return { status: "ok", data: result.value };
}

/** Operational panels that must stay fresh — not served from the metrics snapshot. */
export async function loadAdminLiveOps(): Promise<AdminLiveOps> {
  const [health, cronHealth, openQueue, recentSubmissions] = await Promise.all([
    settleLive("admin.live.reviewHealth", () =>
      withDbRetry(() => countReviewHealthStats(new Date().toISOString())),
    ),
    settleLive("admin.live.cronHealth", () =>
      withDbRetry(() => fetchCronSyncHealth()),
    ),
    settleLive("admin.live.openQueue", async () => {
      const rows = await withDbRetry(() =>
        listReviewQueue(undefined, { enrich: false }),
      );
      return filterDemoSubmissions(rows);
    }),
    settleLive("admin.live.recentSubmissions", () =>
      withDbRetry(() => listRecentSubmissionsForAdmin(25)),
    ),
  ]);

  return { health, cronHealth, openQueue, recentSubmissions };
}
