import { count, inArray } from "drizzle-orm";

import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { milestoneEvents } from "@/lib/db/schema";
import { summarizeDurations, type DurationSummary } from "@/lib/impact/stats";
import type { MilestoneType } from "@/lib/milestones/types";

/** Ordered stages of the First Contribution funnel — every stage here is a
 *  milestone_events row, so counting is a plain GROUP BY (the table's
 *  unique(user_id, milestone_type) index means each user contributes at
 *  most one row per stage — no DISTINCT needed). */
const FUNNEL_STAGE_TYPES = [
  "first_contribution_started",
  "practice_first_pr_opened",
  "practice_first_pr_submitted",
  "practice_first_pr_merged",
  "first_contribution_completed",
] as const satisfies readonly MilestoneType[];

const STAGE_LABELS: Record<(typeof FUNNEL_STAGE_TYPES)[number], string> = {
  first_contribution_started: "Started",
  practice_first_pr_opened: "PR opened",
  practice_first_pr_submitted: "PR submitted",
  practice_first_pr_merged: "PR merged",
  first_contribution_completed: "Completed",
};

export type FirstContributionFunnelStage = {
  type: MilestoneType;
  label: string;
  users: number;
};

export type FirstContributionFunnel = {
  stages: FirstContributionFunnelStage[];
  /** Percentage (0-100, one decimal), null when the denominator stage has 0 users. */
  conversion: {
    startedToPrOpened: number | null;
    prOpenedToPrMerged: number | null;
  };
  timeToPrOpened: DurationSummary;
  timeToPrMerged: DurationSummary;
  /**
   * Always false: first_real_project_clicked (see
   * lib/first-contribution/analytics.ts) only exists as a client-side
   * @vercel/analytics custom event — Vercel Web Analytics has no API this
   * app can query to read custom events back, so "Completed → Real project
   * click" and "time from completion to click" cannot be computed here.
   * Per the Phase 17 spec ("if a metric cannot be calculated reliably... do
   * not invent it"), this is surfaced as explicitly unavailable rather than
   * approximated — check the Vercel Analytics dashboard directly for that
   * event.
   */
  realProjectClickDataAvailable: false;
};

function emptyFunnel(): FirstContributionFunnel {
  return {
    stages: FUNNEL_STAGE_TYPES.map((type) => ({ type, label: STAGE_LABELS[type], users: 0 })),
    conversion: { startedToPrOpened: null, prOpenedToPrMerged: null },
    timeToPrOpened: summarizeDurations([], 0),
    timeToPrMerged: summarizeDurations([], 0),
    realProjectClickDataAvailable: false,
  };
}

/** Pure — exported for unit testing (see tests/first-contribution-funnel.test.ts). */
export function conversionPct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Milliseconds from `fromAt` to `toAt`, or null if `toAt` is missing or the
 *  pair is out of order (shouldn't happen given the milestones' natural
 *  ordering, but a clock skew or backfilled row could produce it).
 *  Pure — exported for unit testing. */
export function durationMs(fromAt: string | undefined, toAt: string | undefined): number | null {
  if (!fromAt || !toAt) return null;
  const ms = Date.parse(toAt) - Date.parse(fromAt);
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

export async function getFirstContributionFunnel(): Promise<FirstContributionFunnel> {
  if (!isDatabaseConfigured()) {
    return emptyFunnel();
  }

  return withDbRetry(async () => {
    const db = getDb();

    const [counts, rows] = await Promise.all([
      db
        .select({ milestoneType: milestoneEvents.milestoneType, value: count() })
        .from(milestoneEvents)
        .where(inArray(milestoneEvents.milestoneType, FUNNEL_STAGE_TYPES))
        .groupBy(milestoneEvents.milestoneType),
      db
        .select({
          userId: milestoneEvents.userId,
          milestoneType: milestoneEvents.milestoneType,
          achievedAt: milestoneEvents.achievedAt,
        })
        .from(milestoneEvents)
        .where(inArray(milestoneEvents.milestoneType, FUNNEL_STAGE_TYPES)),
    ]);

    const countByType = new Map<MilestoneType, number>(
      counts.map((row) => [row.milestoneType as MilestoneType, Number(row.value)]),
    );
    const stages = FUNNEL_STAGE_TYPES.map((type) => ({
      type,
      label: STAGE_LABELS[type],
      users: countByType.get(type) ?? 0,
    }));

    const achievedAtByUser = new Map<string, Partial<Record<MilestoneType, string>>>();
    for (const row of rows) {
      const byType = achievedAtByUser.get(row.userId) ?? {};
      byType[row.milestoneType as MilestoneType] = row.achievedAt;
      achievedAtByUser.set(row.userId, byType);
    }

    const startToPrOpenedDurations: number[] = [];
    let startToPrOpenedPending = 0;
    const prOpenedToMergedDurations: number[] = [];
    let prOpenedToMergedPending = 0;

    for (const byType of achievedAtByUser.values()) {
      const started = byType.first_contribution_started;
      const prOpened = byType.practice_first_pr_opened;
      const prMerged = byType.practice_first_pr_merged;

      // Pending = reached the reference stage but not yet the target one —
      // never folded into the duration stats as a zero (see
      // lib/impact/stats.ts's own warning on this exact point).
      if (started) {
        const ms = durationMs(started, prOpened);
        if (ms !== null) startToPrOpenedDurations.push(ms);
        else startToPrOpenedPending += 1;
      }

      if (prOpened) {
        const ms = durationMs(prOpened, prMerged);
        if (ms !== null) prOpenedToMergedDurations.push(ms);
        else prOpenedToMergedPending += 1;
      }
    }

    const startedCount = countByType.get("first_contribution_started") ?? 0;
    const prOpenedCount = countByType.get("practice_first_pr_opened") ?? 0;
    const prMergedCount = countByType.get("practice_first_pr_merged") ?? 0;

    return {
      stages,
      conversion: {
        startedToPrOpened: conversionPct(prOpenedCount, startedCount),
        prOpenedToPrMerged: conversionPct(prMergedCount, prOpenedCount),
      },
      timeToPrOpened: summarizeDurations(startToPrOpenedDurations, startToPrOpenedPending),
      timeToPrMerged: summarizeDurations(prOpenedToMergedDurations, prOpenedToMergedPending),
      realProjectClickDataAvailable: false,
    };
  });
}
