import { and, count, eq, gte, inArray, isNotNull, lte, sql } from "drizzle-orm";

import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  githubConnections,
  githubPullRequestEvents,
  githubPullRequests,
  opportunityEvents,
  orgMemberships,
  projects,
  userRoadmapProgress,
  users,
} from "@/lib/db/schema";
import { AFRICAN_COUNTRY_CODES, getCountryCodesForRegion } from "@/lib/geo/countries";

import { ACTIVE_CONTRIBUTOR_WINDOW_DAYS, monthBucket } from "./definitions";
import { summarizeCounts, summarizeDurations, type DurationSummary } from "./stats";

/**
 * Shared filter shape for the internal impact query layer. Not every metric
 * honors every filter — each function documents which ones it applies.
 * Built directly on Drizzle, following the existing
 * lib/admin/metrics-queries.ts pattern rather than introducing a new
 * query-builder abstraction.
 */
export type ImpactFilters = {
  /** users.createdAt >= since (ISO timestamp) */
  since?: string;
  /** users.createdAt <= until (ISO timestamp) */
  until?: string;
  /** ISO 3166-1 alpha-2 */
  country?: string;
  /** Matches lib/geo/countries.ts CountryInfo.region (e.g. "Western Africa") */
  region?: string;
  partnerId?: string;
  acquisitionSource?: string;
  repoFullName?: string;
};

function userDateConditions(filters: ImpactFilters) {
  const conditions = [];
  if (filters.since) conditions.push(gte(users.createdAt, filters.since));
  if (filters.until) conditions.push(lte(users.createdAt, filters.until));
  return conditions;
}

function userGeoAndSourceConditions(filters: ImpactFilters) {
  const conditions = [];
  if (filters.country) conditions.push(eq(users.country, filters.country));
  if (filters.region) {
    const codes = getCountryCodesForRegion(filters.region);
    conditions.push(codes.length > 0 ? inArray(users.country, codes) : sql`false`);
  }
  if (filters.acquisitionSource) {
    conditions.push(
      eq(
        users.acquisitionSource,
        filters.acquisitionSource as (typeof users.acquisitionSource.enumValues)[number],
      ),
    );
  }
  return conditions;
}

async function scalarCount(query: Promise<Array<{ value: number }>>): Promise<number> {
  const rows = await query;
  return Number(rows[0]?.value ?? 0);
}

// ─── 1-2. Developer counts ──────────────────────────────────────────────────

export async function countTotalDevelopers(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const conditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    return scalarCount(
      db
        .select({ value: count() })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    );
  });
}

// ─── 3. GitHub connected developers ─────────────────────────────────────────

/**
 * Real data, honestly caveated: GitHub connection happens automatically at
 * signup (same OAuth event) for the overwhelming majority of users, so this
 * is close to a developer count, not an independent conversion signal. See
 * docs/metrics-definitions.md.
 */
export async function countGithubConnectedDevelopers(
  filters: ImpactFilters = {},
): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    return scalarCount(
      db
        .select({ value: count() })
        .from(githubConnections)
        .innerJoin(users, eq(githubConnections.userId, users.id))
        .where(userConditions.length > 0 ? and(...userConditions) : undefined),
    );
  });
}

// ─── 4. Email verified users — not applicable, documented explicitly ───────

export type EmailVerificationAvailability = {
  supported: false;
  reason: string;
};

/**
 * Pull's only sign-in method is GitHub OAuth (see app/actions/auth.ts) — there
 * is no email/password signup path for an email-verification step to apply
 * to. Returning a fake 0 or 100% here would misrepresent the product; this
 * function exists so callers get an explicit, typed "not applicable" instead
 * of silently wrong data.
 */
export function emailVerifiedUsersAvailability(): EmailVerificationAvailability {
  return {
    supported: false,
    reason: "Pull has no email/password signup path — every account authenticates via GitHub OAuth.",
  };
}

// ─── 5. Developers who explored an opportunity ──────────────────────────────

/**
 * Unions the new first-party opportunity_events log with the legacy
 * per-partner exploredOpportunityAt timestamp so historical signal isn't
 * lost. See the audit's Section F finding on what "explored" actually means
 * today (first click on any link, not a deliberate action).
 */
export async function countDevelopersWhoExploredOpportunities(
  filters: ImpactFilters = {},
): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const userIdFilter = userConditions.length > 0 ? and(...userConditions) : undefined;

    const [eventRows, legacyRows] = await Promise.all([
      db
        .selectDistinct({ userId: opportunityEvents.userId })
        .from(opportunityEvents)
        .innerJoin(users, eq(opportunityEvents.userId, users.id))
        .where(userIdFilter),
      db
        .selectDistinct({ userId: orgMemberships.userId })
        .from(orgMemberships)
        .innerJoin(users, eq(orgMemberships.userId, users.id))
        .where(and(isNotNull(orgMemberships.exploredOpportunityAt), ...userConditions)),
    ]);

    const distinctUsers = new Set<string>();
    for (const row of eventRows) distinctUsers.add(row.userId);
    for (const row of legacyRows) distinctUsers.add(row.userId);
    return distinctUsers.size;
  });
}

// ─── 6-8. Contribution-based developer counts ───────────────────────────────

function qualifyingConditions() {
  return [eq(githubPullRequests.merged, true), eq(githubPullRequests.isOwnRepo, false)];
}

export async function countDevelopersWhoOpenedPR(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const prConditions = filters.repoFullName
      ? [eq(githubPullRequests.repoFullName, filters.repoFullName)]
      : [];
    if (filters.partnerId) prConditions.push(eq(githubPullRequests.attributedPartnerId, filters.partnerId));

    return scalarCount(
      db
        .select({ value: sql<number>`count(distinct ${githubPullRequests.userId})::int` })
        .from(githubPullRequests)
        .innerJoin(users, eq(githubPullRequests.userId, users.id))
        .where(and(...userConditions, ...prConditions)),
    );
  });
}

/** "Verified Contributor" — see lib/impact/definitions.ts. */
export async function countVerifiedContributors(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const prConditions = [...qualifyingConditions()];
    if (filters.repoFullName) prConditions.push(eq(githubPullRequests.repoFullName, filters.repoFullName));
    if (filters.partnerId) prConditions.push(eq(githubPullRequests.attributedPartnerId, filters.partnerId));

    return scalarCount(
      db
        .select({ value: sql<number>`count(distinct ${githubPullRequests.userId})::int` })
        .from(githubPullRequests)
        .innerJoin(users, eq(githubPullRequests.userId, users.id))
        .where(and(...userConditions, ...prConditions)),
    );
  });
}

/** "Repeat Contributor" — >= 2 qualifying merged contributions. */
export async function countRepeatContributors(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const prConditions = [...qualifyingConditions()];
    if (filters.partnerId) prConditions.push(eq(githubPullRequests.attributedPartnerId, filters.partnerId));

    const rows = await db
      .select({ userId: githubPullRequests.userId, value: count() })
      .from(githubPullRequests)
      .innerJoin(users, eq(githubPullRequests.userId, users.id))
      .where(and(...userConditions, ...prConditions))
      .groupBy(githubPullRequests.userId)
      .having(sql`count(*) >= 2`);

    return rows.length;
  });
}

/** "Active Contributor" — PR opened or merged within the trailing window. */
export async function countActiveContributors(
  filters: ImpactFilters = {},
  windowDays: number = ACTIVE_CONTRIBUTOR_WINDOW_DAYS,
): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];

    return scalarCount(
      db
        .select({ value: sql<number>`count(distinct ${githubPullRequestEvents.userId})::int` })
        .from(githubPullRequestEvents)
        .innerJoin(users, eq(githubPullRequestEvents.userId, users.id))
        .where(
          and(
            inArray(githubPullRequestEvents.eventType, ["opened", "merged"]),
            gte(githubPullRequestEvents.occurredAt, since),
            ...userConditions,
          ),
        ),
    );
  });
}

/** "Sustained Contributor" — qualifying activity across >= 3 distinct months. */
export async function countSustainedContributors(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];

    const rows = await db
      .select({ userId: githubPullRequestEvents.userId, occurredAt: githubPullRequestEvents.occurredAt })
      .from(githubPullRequestEvents)
      .innerJoin(users, eq(githubPullRequestEvents.userId, users.id))
      .where(and(eq(githubPullRequestEvents.eventType, "merged"), ...userConditions));

    const monthsByUser = new Map<string, Set<string>>();
    for (const row of rows) {
      const months = monthsByUser.get(row.userId) ?? new Set<string>();
      months.add(monthBucket(row.occurredAt));
      monthsByUser.set(row.userId, months);
    }

    let sustained = 0;
    for (const months of monthsByUser.values()) {
      if (months.size >= 3) sustained += 1;
    }
    return sustained;
  });
}

// ─── 11-15. Contribution / repo / project totals ────────────────────────────

export async function countTotalPRs(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const prConditions = filters.partnerId
      ? [eq(githubPullRequests.attributedPartnerId, filters.partnerId)]
      : [];
    return scalarCount(
      db
        .select({ value: count() })
        .from(githubPullRequests)
        .innerJoin(users, eq(githubPullRequests.userId, users.id))
        .where(and(...userConditions, ...prConditions)),
    );
  });
}

export async function countTotalMergedPRs(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const prConditions = [eq(githubPullRequests.merged, true)];
    if (filters.partnerId) prConditions.push(eq(githubPullRequests.attributedPartnerId, filters.partnerId));
    return scalarCount(
      db
        .select({ value: count() })
        .from(githubPullRequests)
        .innerJoin(users, eq(githubPullRequests.userId, users.id))
        .where(and(...userConditions, ...prConditions)),
    );
  });
}

export async function countUniqueRepositories(filters: ImpactFilters = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const prConditions = filters.partnerId
      ? [eq(githubPullRequests.attributedPartnerId, filters.partnerId)]
      : [];
    return scalarCount(
      db
        .select({ value: sql<number>`count(distinct ${githubPullRequests.repoFullName})::int` })
        .from(githubPullRequests)
        .innerJoin(users, eq(githubPullRequests.userId, users.id))
        .where(and(...userConditions, ...prConditions)),
    );
  });
}

/**
 * "Projects with Pull contributors" — only counts catalog projects that an
 * admin has explicitly linked to a real repo via projects.primaryRepoFullName
 * (see lib/db/schema/roadmaps.ts). Unmapped catalog projects can't be
 * reconciled against synced PR data and are correctly excluded, not
 * miscounted as zero-contribution.
 */
export async function countProjectsWithPullContributors(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  return withDbRetry(async () => {
    const db = getDb();
    const rows = await db
      .select({ value: sql<number>`count(distinct ${projects.id})::int` })
      .from(projects)
      .innerJoin(
        githubPullRequests,
        eq(sql`lower(${projects.primaryRepoFullName})`, sql`lower(${githubPullRequests.repoFullName})`),
      )
      .where(isNotNull(projects.primaryRepoFullName));
    return Number(rows[0]?.value ?? 0);
  });
}

// ─── 16-17. Median time to first (merged) PR ────────────────────────────────

async function timeToFirstPrRows(mergedOnly: boolean, filters: ImpactFilters) {
  const db = getDb();
  const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];

  const firstPrSubquery = db
    .select({
      userId: githubPullRequests.userId,
      firstAt: mergedOnly
        ? sql<string>`min(${githubPullRequests.githubMergedAt})`.as("first_at")
        : sql<string>`min(${githubPullRequests.githubCreatedAt})`.as("first_at"),
    })
    .from(githubPullRequests)
    .where(mergedOnly ? eq(githubPullRequests.merged, true) : undefined)
    .groupBy(githubPullRequests.userId)
    .as("first_pr");

  return db
    .select({
      userCreatedAt: users.createdAt,
      firstAt: firstPrSubquery.firstAt,
    })
    .from(users)
    .leftJoin(firstPrSubquery, eq(users.id, firstPrSubquery.userId))
    .where(userConditions.length > 0 ? and(...userConditions) : undefined);
}

/** Handles incomplete journeys correctly — users with no (merged) PR yet
 *  count as "pending", never as a duration of zero. */
export async function timeToFirstPR(filters: ImpactFilters = {}): Promise<DurationSummary> {
  if (!isDatabaseConfigured()) return summarizeDurations([], 0);
  return withDbRetry(async () => {
    const rows = await timeToFirstPrRows(false, filters);
    return summarizeRowsAsDuration(rows);
  });
}

export async function timeToFirstMergedPR(filters: ImpactFilters = {}): Promise<DurationSummary> {
  if (!isDatabaseConfigured()) return summarizeDurations([], 0);
  return withDbRetry(async () => {
    const rows = await timeToFirstPrRows(true, filters);
    return summarizeRowsAsDuration(rows);
  });
}

function summarizeRowsAsDuration(
  rows: Array<{ userCreatedAt: string; firstAt: string | null }>,
): DurationSummary {
  const durations: number[] = [];
  let pending = 0;
  for (const row of rows) {
    if (!row.firstAt) {
      pending += 1;
      continue;
    }
    const durationMs = Date.parse(row.firstAt) - Date.parse(row.userCreatedAt);
    if (Number.isFinite(durationMs) && durationMs >= 0) {
      durations.push(durationMs);
    } else {
      pending += 1;
    }
  }
  return summarizeDurations(durations, pending);
}

// ─── 21-22. Geography ────────────────────────────────────────────────────

export type GeographyBreakdown = {
  countriesRepresented: number;
  africanCountriesRepresented: number;
  usersWithKnownCountry: number;
  totalUsers: number;
};

/**
 * "Represented" here means "at least one user reports this country" — NOT
 * necessarily "at least one contributor." Use
 * countCountriesAmongContributors() for the contribution-linked claim (the
 * one the audit specifically flagged as unsupportable without joining
 * geography to contribution data).
 */
export async function getGeographyBreakdown(
  filters: ImpactFilters = {},
): Promise<GeographyBreakdown> {
  if (!isDatabaseConfigured()) {
    return { countriesRepresented: 0, africanCountriesRepresented: 0, usersWithKnownCountry: 0, totalUsers: 0 };
  }
  return withDbRetry(async () => {
    const db = getDb();
    const conditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];

    const [totalRows, knownRows, countryRows, africaRows] = await Promise.all([
      db.select({ value: count() }).from(users).where(conditions.length > 0 ? and(...conditions) : undefined),
      db
        .select({ value: count() })
        .from(users)
        .where(and(isNotNull(users.country), ...conditions)),
      db
        .select({ value: sql<number>`count(distinct ${users.country})::int` })
        .from(users)
        .where(and(isNotNull(users.country), ...conditions)),
      db
        .select({ value: sql<number>`count(distinct ${users.country})::int` })
        .from(users)
        .where(and(isNotNull(users.country), inArray(users.country, AFRICAN_COUNTRY_CODES), ...conditions)),
    ]);

    return {
      totalUsers: Number(totalRows[0]?.value ?? 0),
      usersWithKnownCountry: Number(knownRows[0]?.value ?? 0),
      countriesRepresented: Number(countryRows[0]?.value ?? 0),
      africanCountriesRepresented: Number(africaRows[0]?.value ?? 0),
    };
  });
}

/**
 * "Countries represented among contributors [with a qualifying merged PR]" —
 * the specific, stricter claim the audit said Pull could not honestly make
 * without joining geography to contribution outcomes. Only counts a country
 * if a user from that country has an actual qualifying contribution.
 */
export async function countCountriesAmongContributors(
  mergedOnly: boolean,
  filters: ImpactFilters = {},
): Promise<{ countriesRepresented: number; africanCountriesRepresented: number }> {
  if (!isDatabaseConfigured()) return { countriesRepresented: 0, africanCountriesRepresented: 0 };
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const prConditions = mergedOnly ? [...qualifyingConditions()] : [];

    const [countryRows, africaRows] = await Promise.all([
      db
        .select({ value: sql<number>`count(distinct ${users.country})::int` })
        .from(githubPullRequests)
        .innerJoin(users, eq(githubPullRequests.userId, users.id))
        .where(and(isNotNull(users.country), ...userConditions, ...prConditions)),
      db
        .select({ value: sql<number>`count(distinct ${users.country})::int` })
        .from(githubPullRequests)
        .innerJoin(users, eq(githubPullRequests.userId, users.id))
        .where(
          and(
            isNotNull(users.country),
            inArray(users.country, AFRICAN_COUNTRY_CODES),
            ...userConditions,
            ...prConditions,
          ),
        ),
    ]);

    return {
      countriesRepresented: Number(countryRows[0]?.value ?? 0),
      africanCountriesRepresented: Number(africaRows[0]?.value ?? 0),
    };
  });
}

// ─── 23-24. Education / opportunity → contribution conversion ──────────────

export type ConversionResult = {
  eligible: number;
  converted: number;
  rate: number | null;
};

/** Users who completed at least one roadmap node, then went on to open a
 *  qualifying (merged) PR after that completion. */
export async function educationToContributionConversion(): Promise<ConversionResult> {
  if (!isDatabaseConfigured()) return { eligible: 0, converted: 0, rate: null };
  return withDbRetry(async () => {
    const db = getDb();
    const completions = await db
      .select({ userId: userRoadmapProgress.userId, completedAt: sql<string>`min(${userRoadmapProgress.completedAt})` })
      .from(userRoadmapProgress)
      .where(and(eq(userRoadmapProgress.status, "completed"), isNotNull(userRoadmapProgress.completedAt)))
      .groupBy(userRoadmapProgress.userId);

    if (completions.length === 0) return { eligible: 0, converted: 0, rate: null };

    const userIds = completions.map((c) => c.userId);
    const firstMerged = await db
      .select({ userId: githubPullRequests.userId, firstMergedAt: sql<string>`min(${githubPullRequests.githubMergedAt})` })
      .from(githubPullRequests)
      .where(and(eq(githubPullRequests.merged, true), inArray(githubPullRequests.userId, userIds)))
      .groupBy(githubPullRequests.userId);

    const firstMergedByUser = new Map(firstMerged.map((row) => [row.userId, row.firstMergedAt]));
    let converted = 0;
    for (const completion of completions) {
      const firstMergedAt = firstMergedByUser.get(completion.userId);
      if (firstMergedAt && Date.parse(firstMergedAt) > Date.parse(completion.completedAt)) {
        converted += 1;
      }
    }

    return { eligible: completions.length, converted, rate: converted / completions.length };
  });
}

/** Users with a tracked "clicked through to GitHub" opportunity event whose
 *  click is attributed to an actual merged PR (see lib/github/attribution.ts). */
export async function opportunityToContributionConversion(): Promise<ConversionResult> {
  if (!isDatabaseConfigured()) return { eligible: 0, converted: 0, rate: null };
  return withDbRetry(async () => {
    const db = getDb();
    const clickers = await db
      .select({ value: sql<number>`count(distinct ${opportunityEvents.userId})::int` })
      .from(opportunityEvents)
      .where(eq(opportunityEvents.eventType, "clicked_github"));

    const converted = await db
      .select({ value: sql<number>`count(distinct ${githubPullRequests.userId})::int` })
      .from(githubPullRequests)
      .where(and(isNotNull(githubPullRequests.attributedOpportunityEventId), eq(githubPullRequests.merged, true)));

    const eligible = Number(clickers[0]?.value ?? 0);
    const convertedCount = Number(converted[0]?.value ?? 0);
    return { eligible, converted: convertedCount, rate: eligible > 0 ? convertedCount / eligible : null };
  });
}

// ─── PRs-per-contributor (mean/median) ───────────────────────────────────

export async function prsPerContributor(filters: ImpactFilters = {}) {
  if (!isDatabaseConfigured()) return summarizeCounts([]);
  return withDbRetry(async () => {
    const db = getDb();
    const userConditions = [...userDateConditions(filters), ...userGeoAndSourceConditions(filters)];
    const rows = await db
      .select({ userId: githubPullRequests.userId, value: count() })
      .from(githubPullRequests)
      .innerJoin(users, eq(githubPullRequests.userId, users.id))
      .where(userConditions.length > 0 ? and(...userConditions) : undefined)
      .groupBy(githubPullRequests.userId);
    return summarizeCounts(rows.map((r) => Number(r.value)));
  });
}
