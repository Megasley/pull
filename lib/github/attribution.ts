import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { opportunityEvents, orgMemberships } from "@/lib/db/schema";

import { OPPORTUNITY_ATTRIBUTION_WINDOW_DAYS } from "./config";

/**
 * Attribution rules for a newly-discovered contribution. Both functions are
 * deliberately conservative: they establish a documented correlation, never
 * a claim of causation. Attribution is computed once, at first insert, and
 * never recomputed — see lib/github/store.ts:upsertGithubPullRequests.
 */

export type PartnerMembershipForAttribution = {
  organizationId: string;
  joinedAt: string;
};

/** Fetch once per sync and reuse across all of a user's PRs in that sync. */
export async function loadPartnerMembershipsForAttribution(
  userId: string,
): Promise<PartnerMembershipForAttribution[]> {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select({
      organizationId: orgMemberships.organizationId,
      joinedAt: orgMemberships.joinedAt,
    })
    .from(orgMemberships)
    .where(eq(orgMemberships.userId, userId))
    .orderBy(orgMemberships.joinedAt);
  return rows;
}

/**
 * Rule: attribute to the most recently joined partner whose membership
 * predates the contribution. A user can belong to several partners at once
 * (Pull supports that — see lib/partners/memberships.ts); this rule picks
 * whichever was the user's active program context at contribution time,
 * rather than always favoring the first partner they ever joined.
 *
 * This is "membership at time of contribution," not acquisition source and
 * not causation — a user can have pre-existing OSS activity unrelated to the
 * partner they happen to belong to.
 */
export function resolvePartnerAttribution(
  memberships: PartnerMembershipForAttribution[],
  contributionOpenedAt: string | null,
): string | null {
  if (!contributionOpenedAt || memberships.length === 0) return null;
  const openedAtMs = Date.parse(contributionOpenedAt);
  if (Number.isNaN(openedAtMs)) return null;

  let best: PartnerMembershipForAttribution | null = null;
  for (const membership of memberships) {
    const joinedAtMs = Date.parse(membership.joinedAt);
    if (Number.isNaN(joinedAtMs) || joinedAtMs > openedAtMs) continue;
    if (!best || joinedAtMs > Date.parse(best.joinedAt)) {
      best = membership;
    }
  }
  return best?.organizationId ?? null;
}

export type OpportunityClickForAttribution = {
  id: string;
  repoFullName: string | null;
  createdAt: string;
};

/** Fetch once per sync and reuse across all of a user's PRs in that sync. */
export async function loadOpportunityClicksForAttribution(
  userId: string,
): Promise<OpportunityClickForAttribution[]> {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select({
      id: opportunityEvents.id,
      repoFullName: opportunityEvents.repoFullName,
      createdAt: opportunityEvents.createdAt,
    })
    .from(opportunityEvents)
    .where(
      and(
        eq(opportunityEvents.userId, userId),
        inArray(opportunityEvents.eventType, ["clicked_github"]),
      ),
    )
    .orderBy(desc(opportunityEvents.createdAt))
    .limit(500);
  return rows;
}

/**
 * Rule: attribute to the most recent tracked "clicked through to GitHub"
 * opportunity event on the SAME repo, within the configured window before
 * the PR was opened. This is Pull's strongest available attribution signal
 * — an explicit, timestamped, repo-matched action that precedes the
 * contribution — but it is still a correlation rule, documented as such.
 */
export function resolveOpportunityAttribution(
  clicks: OpportunityClickForAttribution[],
  repoFullName: string,
  contributionOpenedAt: string | null,
  windowDays: number = OPPORTUNITY_ATTRIBUTION_WINDOW_DAYS,
): string | null {
  if (!contributionOpenedAt) return null;
  const openedAtMs = Date.parse(contributionOpenedAt);
  if (Number.isNaN(openedAtMs)) return null;
  const windowStartMs = openedAtMs - windowDays * 24 * 60 * 60 * 1000;

  let best: OpportunityClickForAttribution | null = null;
  for (const click of clicks) {
    if (!click.repoFullName || click.repoFullName.toLowerCase() !== repoFullName.toLowerCase()) {
      continue;
    }
    const clickedAtMs = Date.parse(click.createdAt);
    if (Number.isNaN(clickedAtMs)) continue;
    if (clickedAtMs > openedAtMs || clickedAtMs < windowStartMs) continue;
    if (!best || clickedAtMs > Date.parse(best.createdAt)) {
      best = click;
    }
  }
  return best?.id ?? null;
}
