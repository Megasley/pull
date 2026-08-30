import { and, eq } from "drizzle-orm";

import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { githubPullRequests } from "@/lib/db/schema";

import { monthBucket, type RetentionWindowDays } from "./definitions";
import { summarizeDurations, type DurationSummary } from "./stats";

/**
 * Cohort: contributors whose FIRST qualifying (merged, non-own-repo)
 * contribution happened at least `windowDays` ago (so they've had the full
 * window to possibly retain). Return event: a SECOND qualifying contribution
 * within `windowDays` of the first. This is the definition recommended (but
 * not implemented) in the original audit — now implemented here, and
 * documented in docs/metrics-definitions.md.
 */
export type RetentionResult = {
  windowDays: number;
  cohortSize: number;
  retainedCount: number;
  rate: number | null;
};

async function loadQualifyingMergeTimestamps(): Promise<Map<string, number[]>> {
  const db = getDb();
  const rows = await db
    .select({ userId: githubPullRequests.userId, mergedAt: githubPullRequests.githubMergedAt })
    .from(githubPullRequests)
    .where(and(eq(githubPullRequests.merged, true), eq(githubPullRequests.isOwnRepo, false)));

  const byUser = new Map<string, number[]>();
  for (const row of rows) {
    if (!row.mergedAt) continue;
    const ts = Date.parse(row.mergedAt);
    if (Number.isNaN(ts)) continue;
    const list = byUser.get(row.userId) ?? [];
    list.push(ts);
    byUser.set(row.userId, list);
  }
  for (const list of byUser.values()) list.sort((a, b) => a - b);
  return byUser;
}

export async function contributorRetention(
  windowDays: RetentionWindowDays,
): Promise<RetentionResult> {
  if (!isDatabaseConfigured()) return { windowDays, cohortSize: 0, retainedCount: 0, rate: null };

  return withDbRetry(async () => {
    const byUser = await loadQualifyingMergeTimestamps();
    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let cohortSize = 0;
    let retainedCount = 0;

    for (const timestamps of byUser.values()) {
      const first = timestamps[0];
      if (now - first < windowMs) continue; // hasn't had the full window yet
      cohortSize += 1;
      const retained = timestamps.some((ts) => ts > first && ts <= first + windowMs);
      if (retained) retainedCount += 1;
    }

    return {
      windowDays,
      cohortSize,
      retainedCount,
      rate: cohortSize > 0 ? retainedCount / cohortSize : null,
    };
  });
}

export async function timeToSecondMergedContribution(): Promise<DurationSummary> {
  if (!isDatabaseConfigured()) return summarizeDurations([], 0);
  return withDbRetry(async () => {
    const byUser = await loadQualifyingMergeTimestamps();
    const durations: number[] = [];
    let pending = 0;
    for (const timestamps of byUser.values()) {
      if (timestamps.length >= 2) {
        durations.push(timestamps[1] - timestamps[0]);
      } else {
        pending += 1;
      }
    }
    return summarizeDurations(durations, pending);
  });
}

export async function countContributorsActiveAcrossMultipleMonths(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const byUser = await loadQualifyingMergeTimestamps();
    let count = 0;
    for (const timestamps of byUser.values()) {
      const months = new Set(timestamps.map((ts) => monthBucket(new Date(ts).toISOString())));
      if (months.size >= 2) count += 1;
    }
    return count;
  });
}
