"use server";

import { redirect } from "next/navigation";

import { recordAdminAction } from "@/lib/admin/audit-log";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  createPartnerOrg,
  deletePartnerOrg,
  getPartnerOrgBySlug,
  setOrgSkills,
  updatePartnerOrg,
} from "@/lib/partners/orgs";

function requireAdmin() {
  if (!isDatabaseConfigured()) {
    throw new Error("Database not configured");
  }
}

async function assertAdmin() {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile || !isAdminRole(profile.role)) {
    redirect("/sign-in");
  }
  return profile;
}

function parseSkillsInput(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

// ─── Organizations ─────────────────────────────────────────────────────────

export type CreatePartnerOrgState = { error: string } | null;

export async function createPartnerOrgAction(
  _prevState: CreatePartnerOrgState,
  formData: FormData,
): Promise<CreatePartnerOrgState> {
  requireAdmin();
  const actor = await assertAdmin();

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const website = (formData.get("website") as string)?.trim() || undefined;
  const logoUrl = (formData.get("logo_url") as string)?.trim() || undefined;
  const skills = parseSkillsInput((formData.get("skills") as string) ?? "");

  if (!name || !slug) {
    return { error: "Name and slug are required." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers, and hyphens only." };
  }
  if (skills.length === 0) {
    return { error: "At least one skill is required." };
  }

  const existing = await getPartnerOrgBySlug(slug);
  if (existing) {
    return { error: `An organization with slug "${slug}" already exists.` };
  }

  const org = await createPartnerOrg({ name, slug, description, website, logoUrl });
  await setOrgSkills(org.id, skills);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "partner_org_created",
    metadata: { orgId: org.id, slug: org.slug, skills },
  });

  redirect(`/admin/partners/${org.slug}`);
}

export type UpdatePartnerOrgState = { error: string } | null;

export async function updatePartnerOrgAction(
  orgId: string,
  _prevState: UpdatePartnerOrgState,
  formData: FormData,
): Promise<UpdatePartnerOrgState> {
  requireAdmin();
  const actor = await assertAdmin();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const website = (formData.get("website") as string)?.trim() || null;
  const logoUrl = (formData.get("logo_url") as string)?.trim() || null;
  const status = formData.get("status") as "active" | "inactive";
  const skills = parseSkillsInput((formData.get("skills") as string) ?? "");

  if (!name) {
    return { error: "Name is required." };
  }
  if (skills.length === 0) {
    return { error: "At least one skill is required." };
  }

  const org = await updatePartnerOrg(orgId, { name, description, website, logoUrl, status });
  await setOrgSkills(org.id, skills);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "partner_org_updated",
    metadata: { orgId: org.id, skills },
  });

  redirect(`/admin/partners/${org.slug}`);
}

export async function deletePartnerOrgAction(orgId: string): Promise<void> {
  requireAdmin();
  const actor = await assertAdmin();

  await deletePartnerOrg(orgId);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "partner_org_deleted",
    metadata: { orgId },
  });

  redirect("/admin/partners");
}
