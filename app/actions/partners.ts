"use server";

import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";

import { requireAdmin as requireActiveAdmin } from "@/app/actions/admin";
import { recordAdminAction } from "@/lib/admin/audit-log";
import { isDatabaseConfigured } from "@/lib/db/env";
import type { OrgQualificationStatus } from "@/lib/partners/memberships";
import { setMembershipQualificationStatus } from "@/lib/partners/memberships";
import {
  createOpportunity,
  deleteOpportunity,
  updateOpportunity,
} from "@/lib/partners/opportunities";
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
  const gate = await requireActiveAdmin();
  if (!gate.ok) {
    redirect("/sign-in");
  }
  return gate.profile;
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

  const org = await updatePartnerOrg(orgId, {
    name,
    description,
    website,
    logoUrl,
    status,
  });
  await setOrgSkills(org.id, skills);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "partner_org_updated",
    metadata: { orgId: org.id, skills },
  });

  redirect(`/admin/partners/${org.slug}`);
}

const QUALIFICATION_STATUSES: OrgQualificationStatus[] = [
  "none",
  "qualified",
  "completed",
  "graduated",
];

export async function setMembershipQualificationStatusAction(
  membershipId: string,
  status: string,
  orgSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  requireAdmin();
  const actor = await assertAdmin();

  if (!QUALIFICATION_STATUSES.includes(status as OrgQualificationStatus)) {
    return { ok: false, error: "Invalid qualification status." };
  }

  const updated = await setMembershipQualificationStatus(
    membershipId,
    status as OrgQualificationStatus,
    actor.id,
  );

  if (!updated) {
    return { ok: false, error: "Membership not found." };
  }

  await recordAdminAction({
    actorUserId: actor.id,
    action: "org_membership_qualification_updated",
    metadata: { membershipId, status },
  });

  revalidatePath(`/admin/partners/${orgSlug}`);
  return { ok: true };
}

// ─── Curated opportunities ──────────────────────────────────────────────────

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

type ParsedOpportunityForm =
  | { ok: false; error: string }
  | {
      ok: true;
      data: {
        title: string;
        description: string;
        difficulty: Difficulty;
        skills: string[];
        contributionType: string | undefined;
        repositoryUrl: string | undefined;
        issueUrl: string | undefined;
        whyRecommended: string | undefined;
        isPinned: boolean;
      };
    };

function parseOpportunityForm(formData: FormData): ParsedOpportunityForm {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const difficultyRaw = (formData.get("difficulty") as string)?.trim();
  const difficulty = DIFFICULTIES.includes(difficultyRaw as Difficulty)
    ? (difficultyRaw as Difficulty)
    : "beginner";
  const skills = parseSkillsInput((formData.get("skills") as string) ?? "");
  const contributionType =
    (formData.get("contributionType") as string)?.trim() || undefined;
  const repositoryUrl = (formData.get("repositoryUrl") as string)?.trim() || undefined;
  const issueUrl = (formData.get("issueUrl") as string)?.trim() || undefined;
  const whyRecommended =
    (formData.get("whyRecommended") as string)?.trim() || undefined;
  const isPinned = formData.get("isPinned") === "on";

  if (!title) {
    return { ok: false, error: "Title is required." };
  }
  if (!repositoryUrl && !issueUrl) {
    return { ok: false, error: "Add a repository URL, an issue URL, or both." };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      difficulty,
      skills,
      contributionType,
      repositoryUrl,
      issueUrl,
      whyRecommended,
      isPinned,
    },
  };
}

export type OpportunityFormState = { error: string } | null;

export async function createOpportunityAction(
  organizationId: string,
  orgSlug: string,
  _prevState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  requireAdmin();
  const actor = await assertAdmin();

  const parsed = parseOpportunityForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const opportunity = await createOpportunity(organizationId, parsed.data);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "org_opportunity_created",
    metadata: {
      organizationId,
      opportunityId: opportunity.id,
      title: opportunity.title,
    },
  });

  revalidatePath(`/admin/partners/${orgSlug}`);
  revalidatePath(`/partners/${orgSlug}`);
  return null;
}

export async function updateOpportunityAction(
  opportunityId: string,
  orgSlug: string,
  _prevState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  requireAdmin();
  const actor = await assertAdmin();

  const parsed = parseOpportunityForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  await updateOpportunity(opportunityId, parsed.data);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "org_opportunity_updated",
    metadata: { opportunityId },
  });

  revalidatePath(`/admin/partners/${orgSlug}`);
  revalidatePath(`/partners/${orgSlug}`);
  return null;
}

export async function deleteOpportunityAction(
  opportunityId: string,
  orgSlug: string,
): Promise<void> {
  requireAdmin();
  const actor = await assertAdmin();

  await deleteOpportunity(opportunityId);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "org_opportunity_deleted",
    metadata: { opportunityId },
  });

  revalidatePath(`/admin/partners/${orgSlug}`);
  revalidatePath(`/partners/${orgSlug}`);
}

export async function toggleOpportunityPinnedAction(
  opportunityId: string,
  orgSlug: string,
  isPinned: boolean,
): Promise<void> {
  requireAdmin();
  await assertAdmin();

  await updateOpportunity(opportunityId, { isPinned });

  revalidatePath(`/admin/partners/${orgSlug}`);
  revalidatePath(`/partners/${orgSlug}`);
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
