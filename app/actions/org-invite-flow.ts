"use server";

import { eq } from "drizzle-orm";

import { recordAdminAction } from "@/lib/admin/audit-log";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users } from "@/lib/db/schema";
import {
  checkOrgInviteLinkValidity,
  redeemOrgInviteLink,
  resolveOrgInviteLinkByToken,
} from "@/lib/partners/org-invites";

function requireDb() {
  if (!isDatabaseConfigured()) throw new Error("Database not configured");
}

export type RedeemOrgLinkActionResult =
  | { ok: true }
  | { ok: false; reason: "not_signed_in" | "invalid" | "seats_full" | "already_member" };

export async function redeemOrgInviteLinkAction(
  rawToken: string,
): Promise<RedeemOrgLinkActionResult> {
  requireDb();

  const profile = await bootstrapCurrentUserProfile();
  if (!profile) return { ok: false, reason: "not_signed_in" };

  const link = await resolveOrgInviteLinkByToken(rawToken);
  if (!link) return { ok: false, reason: "invalid" };

  const validity = checkOrgInviteLinkValidity(link);
  if (!validity.valid) {
    return {
      ok: false,
      reason: validity.reason === "seats_full" ? "seats_full" : "invalid",
    };
  }

  const result = await redeemOrgInviteLink(link.id, profile.id);

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  // Partner-invited users bypass general onboarding.
  if (!profile.onboardingCompletedAt) {
    const db = getDb();
    await db
      .update(users)
      .set({ onboardingCompletedAt: new Date().toISOString() })
      .where(eq(users.id, profile.id));
  }

  await recordAdminAction({
    actorUserId: profile.id,
    action: "org_invite_link_redeemed",
    metadata: { linkId: link.id, orgId: link.organizationId },
  });

  return { ok: true };
}
