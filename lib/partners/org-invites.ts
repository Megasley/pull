import crypto from "crypto";

import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { organizations, orgInviteLinks, orgMemberships } from "@/lib/db/schema";

export type OrgInviteLink = typeof orgInviteLinks.$inferSelect;
export type OrgMembership = typeof orgMemberships.$inferSelect;

// ─── Token helpers ──────────────────────────────────────────────────────────

export const ORG_TOKEN_PREFIX = "o_";

/** Generates an org invite token. The "o_" prefix distinguishes it from
 *  per-participant tokens at the URL routing level. */
export function generateOrgInviteToken(): string {
  return ORG_TOKEN_PREFIX + crypto.randomBytes(32).toString("base64url");
}

export function isOrgInviteToken(token: string): boolean {
  return token.startsWith(ORG_TOKEN_PREFIX);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildOrgInviteUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/invite/${token}`;
}

// ─── Context type ───────────────────────────────────────────────────────────

export type OrgInviteLinkWithOrg = OrgInviteLink & {
  organization: typeof organizations.$inferSelect;
};

// ─── Creation ───────────────────────────────────────────────────────────────

export async function createOrgInviteLink(
  organizationId: string,
  options?: { seatCap?: number; expiresInDays?: number },
): Promise<{ link: OrgInviteLink; rawToken: string }> {
  const db = getDb();

  // Revoke any existing active link for this org
  await db
    .update(orgInviteLinks)
    .set({ status: "revoked", updatedAt: new Date().toISOString() })
    .where(
      and(eq(orgInviteLinks.organizationId, organizationId), eq(orgInviteLinks.status, "active")),
    );

  const rawToken = generateOrgInviteToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt =
    options?.expiresInDays != null
      ? new Date(Date.now() + options.expiresInDays * 86_400_000).toISOString()
      : null;

  const [link] = await db
    .insert(orgInviteLinks)
    .values({
      organizationId,
      tokenHash,
      seatCap: options?.seatCap ?? null,
      expiresAt,
      status: "active",
    })
    .returning();

  return { link, rawToken };
}

// ─── Lookup ─────────────────────────────────────────────────────────────────

export async function resolveOrgInviteLinkByToken(
  rawToken: string,
): Promise<OrgInviteLinkWithOrg | null> {
  const db = getDb();
  const tokenHash = hashToken(rawToken);

  const [row] = await db
    .select({ link: orgInviteLinks, organization: organizations })
    .from(orgInviteLinks)
    .innerJoin(organizations, eq(orgInviteLinks.organizationId, organizations.id))
    .where(eq(orgInviteLinks.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;
  return { ...row.link, organization: row.organization };
}

export async function getActiveOrgInviteLink(
  organizationId: string,
): Promise<OrgInviteLink | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(orgInviteLinks)
    .where(
      and(eq(orgInviteLinks.organizationId, organizationId), eq(orgInviteLinks.status, "active")),
    )
    .limit(1);
  return row ?? null;
}

// ─── Validity ───────────────────────────────────────────────────────────────

export type OrgInviteLinkValidity =
  | { valid: true }
  | { valid: false; reason: "not_found" | "revoked" | "expired" | "seats_full" };

export function checkOrgInviteLinkValidity(link: OrgInviteLink): OrgInviteLinkValidity {
  if (link.status === "revoked") return { valid: false, reason: "revoked" };
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return { valid: false, reason: "expired" };
  }
  if (link.seatCap !== null && link.seatCount >= link.seatCap) {
    return { valid: false, reason: "seats_full" };
  }
  return { valid: true };
}

// ─── Redemption ─────────────────────────────────────────────────────────────

export type RedeemOrgLinkResult =
  | { ok: true; membership: OrgMembership }
  | { ok: false; reason: "invalid" | "seats_full" | "already_member" };

export async function redeemOrgInviteLink(
  linkId: string,
  userId: string,
): Promise<RedeemOrgLinkResult> {
  const db = getDb();

  // Check for existing membership (idempotent)
  const [link] = await db
    .select()
    .from(orgInviteLinks)
    .where(eq(orgInviteLinks.id, linkId))
    .limit(1);

  if (!link || link.status !== "active") return { ok: false, reason: "invalid" };

  const validity = checkOrgInviteLinkValidity(link);
  if (!validity.valid) {
    return { ok: false, reason: validity.reason === "seats_full" ? "seats_full" : "invalid" };
  }

  const [existing] = await db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.organizationId, link.organizationId),
        eq(orgMemberships.userId, userId),
      ),
    )
    .limit(1);

  if (existing) return { ok: true, membership: existing };

  // Increment seat count and create membership atomically enough for our needs
  await db
    .update(orgInviteLinks)
    .set({
      seatCount: sql`${orgInviteLinks.seatCount} + 1`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(orgInviteLinks.id, linkId));

  const [membership] = await db
    .insert(orgMemberships)
    .values({ organizationId: link.organizationId, userId, inviteLinkId: linkId })
    .onConflictDoNothing()
    .returning();

  if (!membership) return { ok: false, reason: "already_member" };

  return { ok: true, membership };
}

// ─── Revoke ─────────────────────────────────────────────────────────────────

export async function revokeOrgInviteLink(linkId: string): Promise<void> {
  const db = getDb();
  await db
    .update(orgInviteLinks)
    .set({ status: "revoked", updatedAt: new Date().toISOString() })
    .where(eq(orgInviteLinks.id, linkId));
}
