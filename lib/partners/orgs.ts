import { and, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orgMemberships, orgSkills, organizations } from "@/lib/db/schema";

export type PartnerOrg = typeof organizations.$inferSelect;
export type PartnerOrgWithMemberCount = PartnerOrg & { memberCount: number };

export async function listPartnerOrgs(): Promise<PartnerOrgWithMemberCount[]> {
  const db = getDb();
  const rows = await db
    .select({
      org: organizations,
      memberCount: count(orgMemberships.id),
    })
    .from(organizations)
    .leftJoin(orgMemberships, eq(orgMemberships.organizationId, organizations.id))
    .where(eq(organizations.type, "learning_partner"))
    .groupBy(organizations.id)
    .orderBy(desc(organizations.createdAt));

  return rows.map((r) => ({ ...r.org, memberCount: r.memberCount }));
}

export async function getPartnerOrgBySlug(slug: string): Promise<PartnerOrg | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.slug, slug), eq(organizations.type, "learning_partner")))
    .limit(1);
  return row ?? null;
}

export async function createPartnerOrg(input: {
  name: string;
  slug: string;
  description: string;
  website?: string;
  logoUrl?: string;
}): Promise<PartnerOrg> {
  const db = getDb();
  const [row] = await db
    .insert(organizations)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      website: input.website ?? null,
      logoUrl: input.logoUrl ?? null,
      type: "learning_partner",
      status: "active",
    })
    .returning();
  return row;
}

export async function updatePartnerOrg(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    website: string | null;
    logoUrl: string | null;
    status: "active" | "inactive";
  }>,
): Promise<PartnerOrg> {
  const db = getDb();
  const [row] = await db
    .update(organizations)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(organizations.id, id))
    .returning();
  return row;
}

export async function deletePartnerOrg(id: string): Promise<void> {
  const db = getDb();
  await db.delete(organizations).where(eq(organizations.id, id));
}

// ─── Skills ─────────────────────────────────────────────────────────────────
// What this org's participants learn — used to match them to relevant
// contribution opportunities (real projects/issues) when they join Pull.

export async function listOrgSkills(organizationId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ skill: orgSkills.skill })
    .from(orgSkills)
    .where(eq(orgSkills.organizationId, organizationId))
    .orderBy(orgSkills.skill);
  return rows.map((r) => r.skill);
}

export async function setOrgSkills(organizationId: string, skills: string[]): Promise<void> {
  const db = getDb();
  await db.delete(orgSkills).where(eq(orgSkills.organizationId, organizationId));
  const unique = [...new Set(skills.map((s) => s.trim()).filter(Boolean))];
  if (unique.length === 0) return;
  await db.insert(orgSkills).values(unique.map((skill) => ({ organizationId, skill })));
}
