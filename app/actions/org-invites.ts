"use server";

import { redirect } from "next/navigation";

import { recordAdminAction } from "@/lib/admin/audit-log";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getPartnerOrgBySlug } from "@/lib/partners/orgs";
import {
  buildOrgInviteUrl,
  createOrgInviteLink,
  getActiveOrgInviteLink,
  revokeOrgInviteLink,
} from "@/lib/partners/org-invites";
import { getSiteUrl } from "@/lib/supabase/env";

async function assertAdmin() {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile || !isAdminRole(profile.role)) redirect("/sign-in");
  return profile;
}

function requireDb() {
  if (!isDatabaseConfigured()) throw new Error("Database not configured");
}

// ─── Generate (or regenerate) the org invite link ──────────────────────────

export type GenerateOrgInviteLinkResult =
  | { ok: true; url: string; seatCap: number | null; expiresAt: string | null }
  | { ok: false; reason: string };

export async function generateOrgInviteLinkAction(
  orgSlug: string,
  options?: { seatCap?: number; expiresInDays?: number },
): Promise<GenerateOrgInviteLinkResult> {
  const actor = await assertAdmin();
  requireDb();

  const org = await getPartnerOrgBySlug(orgSlug);
  if (!org) return { ok: false, reason: "Organization not found" };

  const { link, rawToken } = await createOrgInviteLink(org.id, options);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "org_invite_link_generated",
    metadata: { orgId: org.id, linkId: link.id, seatCap: options?.seatCap ?? null },
  });

  const siteUrl = getSiteUrl() ?? "http://localhost:3001";

  return {
    ok: true,
    url: buildOrgInviteUrl(rawToken, siteUrl),
    seatCap: link.seatCap,
    expiresAt: link.expiresAt,
  };
}

// ─── Get current active link info (URL is not stored — only returned at generation time) ──

export type OrgInviteLinkInfo =
  | { exists: true; linkId: string; seatCap: number | null; seatCount: number; expiresAt: string | null; status: string }
  | { exists: false };

export async function getOrgInviteLinkInfoAction(orgSlug: string): Promise<OrgInviteLinkInfo> {
  await assertAdmin();
  requireDb();

  const org = await getPartnerOrgBySlug(orgSlug);
  if (!org) return { exists: false };

  const link = await getActiveOrgInviteLink(org.id);
  if (!link) return { exists: false };

  return {
    exists: true,
    linkId: link.id,
    seatCap: link.seatCap,
    seatCount: link.seatCount,
    expiresAt: link.expiresAt,
    status: link.status,
  };
}

// ─── Revoke the active link ─────────────────────────────────────────────────

export async function revokeOrgInviteLinkAction(orgSlug: string): Promise<void> {
  const actor = await assertAdmin();
  requireDb();

  const org = await getPartnerOrgBySlug(orgSlug);
  if (!org) throw new Error("Organization not found");

  const link = await getActiveOrgInviteLink(org.id);
  if (!link) return;

  await revokeOrgInviteLink(link.id);

  await recordAdminAction({
    actorUserId: actor.id,
    action: "org_invite_link_revoked",
    metadata: { orgId: org.id, linkId: link.id },
  });
}
