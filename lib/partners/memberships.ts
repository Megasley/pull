import { and, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orgMemberships, organizations, users } from "@/lib/db/schema";

export type OrgMembership = typeof orgMemberships.$inferSelect;
export type OrgQualificationStatus = OrgMembership["qualificationStatus"];

export type OrgMembershipWithOrg = OrgMembership & {
  organization: typeof organizations.$inferSelect;
};

export async function listUserOrgMemberships(userId: string): Promise<OrgMembershipWithOrg[]> {
  const db = getDb();
  const rows = await db
    .select({ membership: orgMemberships, organization: organizations })
    .from(orgMemberships)
    .innerJoin(organizations, eq(orgMemberships.organizationId, organizations.id))
    .where(eq(orgMemberships.userId, userId));

  return rows.map((r) => ({ ...r.membership, organization: r.organization }));
}

/** First org membership for a user — used to link back to their hub from nav. */
export async function getPrimaryOrgMembership(
  userId: string,
): Promise<OrgMembershipWithOrg | null> {
  const db = getDb();
  const [row] = await db
    .select({ membership: orgMemberships, organization: organizations })
    .from(orgMemberships)
    .innerJoin(organizations, eq(orgMemberships.organizationId, organizations.id))
    .where(eq(orgMemberships.userId, userId))
    .orderBy(orgMemberships.joinedAt)
    .limit(1);

  if (!row) return null;
  return { ...row.membership, organization: row.organization };
}

export async function getUserOrgMembershipBySlug(
  userId: string,
  orgSlug: string,
): Promise<OrgMembershipWithOrg | null> {
  const db = getDb();
  const [row] = await db
    .select({ membership: orgMemberships, organization: organizations })
    .from(orgMemberships)
    .innerJoin(organizations, eq(orgMemberships.organizationId, organizations.id))
    .where(and(eq(orgMemberships.userId, userId), eq(organizations.slug, orgSlug)))
    .limit(1);

  if (!row) return null;
  return { ...row.membership, organization: row.organization };
}

export type OrgMembershipWithUser = OrgMembership & {
  user: { id: string; username: string; displayName: string; avatar: string | null };
};

/** For the admin partner detail page — every member of one org, newest first. */
export async function listOrgMembershipsForAdmin(
  organizationId: string,
): Promise<OrgMembershipWithUser[]> {
  const db = getDb();
  const rows = await db
    .select({
      membership: orgMemberships,
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      avatar: users.avatar,
    })
    .from(orgMemberships)
    .innerJoin(users, eq(orgMemberships.userId, users.id))
    .where(eq(orgMemberships.organizationId, organizationId))
    .orderBy(desc(orgMemberships.joinedAt));

  return rows.map((row) => ({
    ...row.membership,
    user: {
      id: row.userId,
      username: row.username,
      displayName: row.displayName,
      avatar: row.avatar,
    },
  }));
}

/**
 * Marks whether a member completed an external program pathway (e.g.
 * Thebuidl's own curriculum) that Pull cannot observe directly. Only an
 * authorized admin/partner action should call this — never inferred from
 * Pull activity. See docs/metrics-definitions.md.
 */
export async function setMembershipQualificationStatus(
  membershipId: string,
  status: OrgQualificationStatus,
  adminUserId: string,
): Promise<OrgMembership | null> {
  const db = getDb();
  const [updated] = await db
    .update(orgMemberships)
    .set({
      qualificationStatus: status,
      qualifiedAt: status === "none" ? null : new Date().toISOString(),
      qualifiedByUserId: status === "none" ? null : adminUserId,
    })
    .where(eq(orgMemberships.id, membershipId))
    .returning();
  return updated ?? null;
}

/** Records the first time a member clicks into an opportunity from their hub. Idempotent. */
export async function markOpportunityExplored(
  userId: string,
  orgSlug: string,
): Promise<void> {
  const db = getDb();
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!org) return;

  await db
    .update(orgMemberships)
    .set({ exploredOpportunityAt: new Date().toISOString() })
    .where(
      and(
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.organizationId, org.id),
        isNull(orgMemberships.exploredOpportunityAt),
      ),
    );
}
