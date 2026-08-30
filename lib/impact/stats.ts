/**
 * Small, dependency-free percentile helper. Pull's codebase had no
 * mean/median/percentile calculation anywhere before this — see the audit's
 * Section J finding. Used for every "time to X" and "PRs per contributor"
 * metric in lib/impact/timing.ts and lib/impact/queries.ts.
 */

export type DurationSample = {
  /** Milliseconds from the reference event to the target event. */
  durationMs: number;
};

export type DurationSummary = {
  /** Users/items that reached the target stage — these back the stats below. */
  completed: number;
  /** Users/items that have NOT reached the target stage yet. Never folded
   *  into the duration stats — an incomplete journey has no duration, not a
   *  duration of zero. See the audit's explicit warning on this point. */
  pending: number;
  medianDays: number | null;
  p25Days: number | null;
  p75Days: number | null;
  p90Days: number | null;
  meanDays: number | null;
};

function percentile(sortedMs: number[], p: number): number {
  if (sortedMs.length === 1) return sortedMs[0];
  const rank = (p / 100) * (sortedMs.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  if (lowerIndex === upperIndex) return sortedMs[lowerIndex];
  const weight = rank - lowerIndex;
  return sortedMs[lowerIndex] * (1 - weight) + sortedMs[upperIndex] * weight;
}

function msToDays(ms: number): number {
  return Math.round((ms / (24 * 60 * 60 * 1000)) * 100) / 100;
}

/** `pendingCount` = how many subjects haven't reached the target stage yet. */
export function summarizeDurations(
  durationsMs: number[],
  pendingCount: number,
): DurationSummary {
  if (durationsMs.length === 0) {
    return {
      completed: 0,
      pending: pendingCount,
      medianDays: null,
      p25Days: null,
      p75Days: null,
      p90Days: null,
      meanDays: null,
    };
  }

  const sorted = [...durationsMs].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;

  return {
    completed: sorted.length,
    pending: pendingCount,
    medianDays: msToDays(percentile(sorted, 50)),
    p25Days: msToDays(percentile(sorted, 25)),
    p75Days: msToDays(percentile(sorted, 75)),
    p90Days: msToDays(percentile(sorted, 90)),
    meanDays: msToDays(mean),
  };
}

export type CountSummary = {
  medianCount: number | null;
  meanCount: number | null;
};

export function summarizeCounts(counts: number[]): CountSummary {
  if (counts.length === 0) return { medianCount: null, meanCount: null };
  const sorted = [...counts].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  return {
    medianCount: Math.round(percentile(sorted, 50) * 100) / 100,
    meanCount: Math.round(mean * 100) / 100,
  };
}
