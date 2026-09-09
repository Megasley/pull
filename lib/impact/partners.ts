import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { githubConnections, githubPullRequests, orgInviteLinks, orgMemberships, users } from "@/lib/db/schema";

import {
  countActiveContributors,
  countSustainedContributors,
  countTotalMergedPRs,
  countTotalPRs,
  countUniqueRepositories,
  countVerifiedAndRepeatContributors,
  type ImpactFilters,
} from "./queries";
import { summarizeDurations, type DurationSummary } from "./stats";

/**
 * Per-partner/program impact rollup. Attribution rule, documented and fixed:
 * a contribution is attributed to a partner if the contributor had an active
 * membership in that org (org_memberships.joinedAt <= PR opened date) at the
 * time the PR was opened — see lib/github/attribution.ts. This is set once,
 * at first sync, and never changes retroactively (e.g. if the user later
 * joins a second partner). It is a correlation, not causation.
 */
export type PartnerImpact = {
  organizationId: string;
  developersInvited: number;
  developersJoined: number;
  githubConnected: number;
  opportunitiesExplored: number;
  verifiedContributors: number;
  repeatContributors: number;
  activeContributors: number;
  sustainedContributors: number;
  totalPRs: number;
  totalMergedPRs: number;
  countriesRepresented: number;
  projectsContributedTo: number;
  medianDaysToFirstPR: number | null;
  medianDaysToFirstMergedPR: number | null;
  timeToFirstPR: DurationSummary;
  timeToFirstMergedPR: DurationSummary;
  qualifiedMemberCount: number;
};

export async function getPartnerImpact(organizationId: string): Promise<PartnerImpact> {
  if (!isDatabaseConfigured()) {
    return emptyPartnerImpact(organizationId);
  }

  return withDbRetry(async () => {
    const db = getDb();
    const filters: ImpactFilters = { partnerId: organizationId };

    const [
      seatRows,
      memberRows,
      connectedRows,
      exploredRows,
      countryRows,
      qualifiedRows,
      verifiedAndRepeat,
      activeContributors,
      sustainedContributors,
      totalPRs,
      totalMergedPRs,
      projectsContributedTo,
      timeToFirstPR,
      timeToFirstMergedPR,
    ] = await Promise.all([
      db
        .select({ value: sql<number>`coalesce(sum(${orgInviteLinks.seatCount}), 0)::int` })
        .from(orgInviteLinks)
        .where(eq(orgInviteLinks.organizationId, organizationId)),
      db.select({ value: sql<number>`count(*)::int` }).from(orgMemberships).where(eq(orgMemberships.organizationId, organizationId)),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(orgMemberships)
        .innerJoin(githubConnections, eq(orgMemberships.userId, githubConnections.userId))
        .where(eq(orgMemberships.organizationId, organizationId)),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(orgMemberships)
        .where(and(eq(orgMemberships.organizationId, organizationId), isNotNull(orgMemberships.exploredOpportunityAt))),
      db
        .select({ value: sql<number>`count(distinct ${users.country})::int` })
        .from(orgMemberships)
        .innerJoin(users, eq(orgMemberships.userId, users.id))
        .where(and(eq(orgMemberships.organizationId, organizationId), isNotNull(users.country))),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(orgMemberships)
        .where(
          and(
            eq(orgMemberships.organizationId, organizationId),
            inArray(orgMemberships.qualificationStatus, ["qualified", "completed", "graduated"]),
          ),
        ),
      countVerifiedAndRepeatContributors(filters),
      countActiveContributors(filters),
      countSustainedContributors(filters),
      countTotalPRs(filters),
      countTotalMergedPRs(filters),
      countUniqueRepositories(filters),
      partnerTimeToFirstContribution(organizationId, false),
      partnerTimeToFirstContribution(organizationId, true),
    ]);
    const { verified: verifiedContributors, repeat: repeatContributors } = verifiedAndRepeat;

    return {
      organizationId,
      developersInvited: Number(seatRows[0]?.value ?? 0),
      developersJoined: Number(memberRows[0]?.value ?? 0),
      githubConnected: Number(connectedRows[0]?.value ?? 0),
      opportunitiesExplored: Number(exploredRows[0]?.value ?? 0),
      countriesRepresented: Number(countryRows[0]?.value ?? 0),
      qualifiedMemberCount: Number(qualifiedRows[0]?.value ?? 0),
      verifiedContributors,
      repeatContributors,
      activeContributors,
      sustainedContributors,
      totalPRs,
      totalMergedPRs,
      projectsContributedTo,
      timeToFirstPR,
      timeToFirstMergedPR,
      medianDaysToFirstPR: timeToFirstPR.medianDays,
      medianDaysToFirstMergedPR: timeToFirstMergedPR.medianDays,
    };
  });
}

/**
 * Time from a member joining this partner org to their first PR attributed
 * to it — NOT from account creation. Only PRs already attributed to this
 * partner (attributedPartnerId) count as the return event, so this measures
 * "contribution while a member of this program," consistent with the
 * attribution rule documented above.
 */
async function partnerTimeToFirstContribution(
  organizationId: string,
  mergedOnly: boolean,
): Promise<DurationSummary> {
  const db = getDb();
  const members = await db
    .select({ userId: orgMemberships.userId, joinedAt: orgMemberships.joinedAt })
    .from(orgMemberships)
    .where(eq(orgMemberships.organizationId, organizationId));

  if (members.length === 0) return summarizeDurations([], 0);

  const userIds = members.map((m) => m.userId);
  const prConditions = [
    eq(githubPullRequests.attributedPartnerId, organizationId),
    inArray(githubPullRequests.userId, userIds),
    ...(mergedOnly
      ? [
          eq(githubPullRequests.merged, true),
          eq(githubPullRequests.isOwnRepo, false),
          eq(githubPullRequests.isPracticeRepo, false),
        ]
      : []),
  ];

  const firstByUser = await db
    .select({
      userId: githubPullRequests.userId,
      firstAt: mergedOnly
        ? sql<string>`min(${githubPullRequests.githubMergedAt})`
        : sql<string>`min(${githubPullRequests.githubCreatedAt})`,
    })
    .from(githubPullRequests)
    .where(and(...prConditions))
    .groupBy(githubPullRequests.userId);

  const firstByUserMap = new Map(firstByUser.map((row) => [row.userId, row.firstAt]));
  const durations: number[] = [];
  let pending = 0;

  for (const member of members) {
    const firstAt = firstByUserMap.get(member.userId);
    if (!firstAt) {
      pending += 1;
      continue;
    }
    const durationMs = Date.parse(firstAt) - Date.parse(member.joinedAt);
    if (Number.isFinite(durationMs) && durationMs >= 0) {
      durations.push(durationMs);
    } else {
      pending += 1;
    }
  }

  return summarizeDurations(durations, pending);
}

function emptyPartnerImpact(organizationId: string): PartnerImpact {
  const empty = summarizeDurations([], 0);
  return {
    organizationId,
    developersInvited: 0,
    developersJoined: 0,
    githubConnected: 0,
    opportunitiesExplored: 0,
    verifiedContributors: 0,
    repeatContributors: 0,
    activeContributors: 0,
    sustainedContributors: 0,
    totalPRs: 0,
    totalMergedPRs: 0,
    countriesRepresented: 0,
    projectsContributedTo: 0,
    medianDaysToFirstPR: null,
    medianDaysToFirstMergedPR: null,
    timeToFirstPR: empty,
    timeToFirstMergedPR: empty,
    qualifiedMemberCount: 0,
  };
}
