import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orgMemberships, organizations } from "@/lib/db/schema";

export type OrgMembership = typeof orgMemberships.$inferSelect;

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
