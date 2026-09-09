/**
 * Central, reusable contributor definitions for impact reporting.
 *
 * These are deliberately separate from — and stricter than — the criteria
 * used by lib/achievements/definitions.ts. Achievements exist to reward and
 * notify individual users and already have real users depending on their
 * current behavior (any merged PR, own-repo included); changing that
 * criteria now would silently revoke/rewrite history for existing users.
 * These definitions exist to make an honest, external-facing claim about
 * open-source impact, so they exclude PRs into a contributor's own
 * repositories. See docs/metrics-definitions.md for the full writeup and
 * the explicit backward-compatibility note.
 *
 * Pure, dependency-free, and unit-tested — see tests/impact.test.ts.
 */

export type ContributionFact = {
  merged: boolean;
  isOwnRepo: boolean;
  /** True for Pull's First Contribution practice repository. Optional so
   *  existing call sites that predate this field don't need updating —
   *  defaults to not-practice. See lib/first-contribution/practice-repo.ts. */
  isPracticeRepo?: boolean;
};

/**
 * A "qualifying contribution" is a merged pull request into a repository
 * the contributor does not themselves own, and that isn't Pull's own First
 * Contribution practice repository. This excludes personal-project PRs
 * (e.g. merging your own PR into your own fork) and practice-repo activity
 * (a training exercise, not external impact) from impact-reporting counts,
 * while leaving the achievement/XP system's broader definition untouched.
 */
export function isQualifyingContribution(pr: ContributionFact): boolean {
  return pr.merged && !pr.isOwnRepo && !pr.isPracticeRepo;
}

/** A developer with at least one qualifying merged contribution. */
export const VERIFIED_CONTRIBUTOR_MIN_QUALIFYING = 1;

/** A developer with at least two qualifying merged contributions. */
export const REPEAT_CONTRIBUTOR_MIN_QUALIFYING = 2;

/**
 * "Active" window for active-contributor / retention calculations. Activity
 * counts a PR being opened OR merged (see lib/db/schema/github.ts:
 * githubPullRequestEvents) — not draft creation alone, and not a page visit.
 */
export const ACTIVE_CONTRIBUTOR_WINDOW_DAYS = 90;

/**
 * A "sustained" contributor has qualifying-contribution activity in at least
 * this many distinct calendar months (not necessarily consecutive).
 */
export const SUSTAINED_CONTRIBUTOR_MIN_MONTHS = 3;

/** Retention horizons this codebase reports on. */
export const RETENTION_WINDOWS_DAYS = [30, 90, 180] as const;
export type RetentionWindowDays = (typeof RETENTION_WINDOWS_DAYS)[number];

export function isRepeatContributor(qualifyingCount: number): boolean {
  return qualifyingCount >= REPEAT_CONTRIBUTOR_MIN_QUALIFYING;
}

export function isVerifiedContributor(qualifyingCount: number): boolean {
  return qualifyingCount >= VERIFIED_CONTRIBUTOR_MIN_QUALIFYING;
}

export function isSustainedContributor(distinctActiveMonths: number): boolean {
  return distinctActiveMonths >= SUSTAINED_CONTRIBUTOR_MIN_MONTHS;
}

/** YYYY-MM bucket for a timestamp, used by the sustained-contributor and
 *  "active across multiple months" calculations. UTC, to match the
 *  timestamp-with-timezone convention used throughout the schema. */
export function monthBucket(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 7);
}
