import { desc, eq, inArray, sql } from "drizzle-orm";

import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  githubConnections,
  githubPullRequestEvents,
  githubPullRequests,
  opportunityEvents,
  organizations,
  orgMemberships,
  users,
} from "@/lib/db/schema";

import { ACTIVE_CONTRIBUTOR_WINDOW_DAYS, isSustainedContributor, monthBucket } from "./definitions";

/**
 * Per-user drill-down for admin — the individual-level view behind the
 * aggregate panels in components/admin/impact-overview-panel.tsx and
 * components/admin/partners/partner-impact-panel.tsx. Every field here
 * traces back to the same durable tables those aggregates use; nothing is
 * computed differently just because it's shown per-user.
 */
export type UserImpactSummary = {
  country: string | null;
  acquisitionSource: string | null;
  acquisitionDetail: Record<string, unknown>;
  githubLogin: string | null;
  githubConnectedAt: string | null;
  totalPRs: number;
  qualifyingMergedPRs: number;
  isVerifiedContributor: boolean;
  isRepeatContributor: boolean;
  isActiveContributor: boolean;
  isSustainedContributor: boolean;
  uniqueRepositories: number;
  firstPRDate: string | null;
  firstMergedPRDate: string | null;
  lastContributionAt: string | null;
  daysToFirstPR: number | null;
  daysToFirstMergedPR: number | null;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    joinedAt: string;
    qualificationStatus: string;
    attributedPRs: number;
    attributedMergedPRs: number;
  }>;
  recentPullRequests: Array<{
    id: string;
    number: number;
    title: string;
    repoFullName: string;
    htmlUrl: string;
    state: string;
    merged: boolean;
    draft: boolean;
    isOwnRepo: boolean;
    isPracticeRepo: boolean;
    attributedPartnerName: string | null;
    attributedViaOpportunity: boolean;
    githubCreatedAt: string | null;
    githubMergedAt: string | null;
  }>;
  recentOpportunityEvents: Array<{
    opportunityKey: string;
    eventType: string;
    repoFullName: string | null;
    createdAt: string;
  }>;
};

function daysBetween(fromIso: string, toIso: string | null): number | null {
  if (!toIso) return null;
  const ms = Date.parse(toIso) - Date.parse(fromIso);
  return Number.isFinite(ms) && ms >= 0 ? Math.round((ms / (24 * 60 * 60 * 1000)) * 100) / 100 : null;
}

export async function getUserImpactSummary(userId: string): Promise<UserImpactSummary | null> {
  if (!isDatabaseConfigured()) return null;

  return withDbRetry(async () => {
    const db = getDb();

    const [userRow] = await db
      .select({ createdAt: users.createdAt, country: users.country, acquisitionSource: users.acquisitionSource, acquisitionDetail: users.acquisitionDetail })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!userRow) return null;

    const [connection] = await db
      .select({ login: githubConnections.login, connectedAt: githubConnections.createdAt })
      .from(githubConnections)
      .where(eq(githubConnections.userId, userId))
      .limit(1);

    const prs = await db
      .select({
        id: githubPullRequests.id,
        number: githubPullRequests.number,
        title: githubPullRequests.title,
        repoFullName: githubPullRequests.repoFullName,
        htmlUrl: githubPullRequests.htmlUrl,
        state: githubPullRequests.state,
        merged: githubPullRequests.merged,
        draft: githubPullRequests.draft,
        isOwnRepo: githubPullRequests.isOwnRepo,
        isPracticeRepo: githubPullRequests.isPracticeRepo,
        attributedPartnerId: githubPullRequests.attributedPartnerId,
        attributedOpportunityEventId: githubPullRequests.attributedOpportunityEventId,
        githubCreatedAt: githubPullRequests.githubCreatedAt,
        githubMergedAt: githubPullRequests.githubMergedAt,
      })
      .from(githubPullRequests)
      .where(eq(githubPullRequests.userId, userId))
      .orderBy(desc(githubPullRequests.githubCreatedAt));

    const qualifying = prs.filter((pr) => pr.merged && !pr.isOwnRepo && !pr.isPracticeRepo);
    const uniqueRepos = new Set(prs.map((pr) => pr.repoFullName.toLowerCase())).size;
    const firstPR = [...prs].reverse().find((pr) => pr.githubCreatedAt);
    const firstQualifyingMerged = [...qualifying]
      .filter((pr) => pr.githubMergedAt)
      .sort((a, b) => Date.parse(a.githubMergedAt!) - Date.parse(b.githubMergedAt!))[0];

    const events = await db
      .select({ eventType: githubPullRequestEvents.eventType, occurredAt: githubPullRequestEvents.occurredAt })
      .from(githubPullRequestEvents)
      .where(eq(githubPullRequestEvents.userId, userId));

    const lastContributionAt = events.reduce<string | null>((latest, event) => {
      if (!latest || Date.parse(event.occurredAt) > Date.parse(latest)) return event.occurredAt;
      return latest;
    }, null);

    const activeWindowStart = Date.now() - ACTIVE_CONTRIBUTOR_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const isActive = events.some(
      (e) => (e.eventType === "opened" || e.eventType === "merged") && Date.parse(e.occurredAt) >= activeWindowStart,
    );
    const mergedMonths = new Set(
      events.filter((e) => e.eventType === "merged").map((e) => monthBucket(e.occurredAt)),
    );

    const membershipRows = await db
      .select({
        organizationId: orgMemberships.organizationId,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        joinedAt: orgMemberships.joinedAt,
        qualificationStatus: orgMemberships.qualificationStatus,
      })
      .from(orgMemberships)
      .innerJoin(organizations, eq(orgMemberships.organizationId, organizations.id))
      .where(eq(orgMemberships.userId, userId));

    const orgNameById = new Map(membershipRows.map((m) => [m.organizationId, m.organizationName]));
    const memberships = membershipRows.map((m) => {
      const attributed = prs.filter((pr) => pr.attributedPartnerId === m.organizationId);
      return {
        organizationId: m.organizationId,
        organizationName: m.organizationName,
        organizationSlug: m.organizationSlug,
        joinedAt: m.joinedAt,
        qualificationStatus: m.qualificationStatus,
        attributedPRs: attributed.length,
        attributedMergedPRs: attributed.filter((pr) => pr.merged).length,
      };
    });

    const opportunityRows = await db
      .select({
        opportunityKey: opportunityEvents.opportunityKey,
        eventType: opportunityEvents.eventType,
        repoFullName: opportunityEvents.repoFullName,
        createdAt: opportunityEvents.createdAt,
      })
      .from(opportunityEvents)
      .where(eq(opportunityEvents.userId, userId))
      .orderBy(desc(opportunityEvents.createdAt))
      .limit(20);

    return {
      country: userRow.country,
      acquisitionSource: userRow.acquisitionSource,
      acquisitionDetail: userRow.acquisitionDetail,
      githubLogin: connection?.login ?? null,
      githubConnectedAt: connection?.connectedAt ?? null,
      totalPRs: prs.length,
      qualifyingMergedPRs: qualifying.length,
      isVerifiedContributor: qualifying.length >= 1,
      isRepeatContributor: qualifying.length >= 2,
      isActiveContributor: isActive,
      isSustainedContributor: isSustainedContributor(mergedMonths.size),
      uniqueRepositories: uniqueRepos,
      firstPRDate: firstPR?.githubCreatedAt ?? null,
      firstMergedPRDate: firstQualifyingMerged?.githubMergedAt ?? null,
      lastContributionAt,
      daysToFirstPR: daysBetween(userRow.createdAt, firstPR?.githubCreatedAt ?? null),
      daysToFirstMergedPR: daysBetween(userRow.createdAt, firstQualifyingMerged?.githubMergedAt ?? null),
      memberships,
      recentPullRequests: prs.slice(0, 25).map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        repoFullName: pr.repoFullName,
        htmlUrl: pr.htmlUrl,
        state: pr.state,
        merged: pr.merged,
        draft: pr.draft,
        isOwnRepo: pr.isOwnRepo,
        isPracticeRepo: pr.isPracticeRepo,
        attributedPartnerName: pr.attributedPartnerId ? (orgNameById.get(pr.attributedPartnerId) ?? null) : null,
        attributedViaOpportunity: Boolean(pr.attributedOpportunityEventId),
        githubCreatedAt: pr.githubCreatedAt,
        githubMergedAt: pr.githubMergedAt,
      })),
      recentOpportunityEvents: opportunityRows,
    };
  });
}

export type UserImpactBadge = {
  totalPRs: number;
  qualifyingMergedPRs: number;
  isVerifiedContributor: boolean;
  isRepeatContributor: boolean;
  country: string | null;
};

/** Batched, compact per-user metrics for the admin users list — avoids N+1
 *  queries when rendering up to 100 rows. */
export async function getUserImpactBadges(userIds: string[]): Promise<Map<string, UserImpactBadge>> {
  const badges = new Map<string, UserImpactBadge>();
  if (!isDatabaseConfigured() || userIds.length === 0) return badges;

  const db = getDb();
  const [countryRows, prRows] = await Promise.all([
    db.select({ id: users.id, country: users.country }).from(users).where(inArray(users.id, userIds)),
    db
      .select({
        userId: githubPullRequests.userId,
        total: sql<number>`count(*)::int`,
        qualifying: sql<number>`count(*) filter (where ${githubPullRequests.merged} and not ${githubPullRequests.isOwnRepo} and not ${githubPullRequests.isPracticeRepo})::int`,
      })
      .from(githubPullRequests)
      .where(inArray(githubPullRequests.userId, userIds))
      .groupBy(githubPullRequests.userId),
  ]);

  const countryByUser = new Map(countryRows.map((row) => [row.id, row.country]));
  for (const userId of userIds) {
    badges.set(userId, {
      totalPRs: 0,
      qualifyingMergedPRs: 0,
      isVerifiedContributor: false,
      isRepeatContributor: false,
      country: countryByUser.get(userId) ?? null,
    });
  }
  for (const row of prRows) {
    const qualifying = Number(row.qualifying);
    badges.set(row.userId, {
      totalPRs: Number(row.total),
      qualifyingMergedPRs: qualifying,
      isVerifiedContributor: qualifying >= 1,
      isRepeatContributor: qualifying >= 2,
      country: countryByUser.get(row.userId) ?? null,
    });
  }
  return badges;
}
