"use server";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { markOpportunityExplored } from "@/lib/partners/memberships";

/** Fired when a member clicks an opportunity link on their org hub. Silently no-ops for non-members. */
export async function recordOpportunityExploredAction(orgSlug: string): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const profile = await bootstrapCurrentUserProfile();
  if (!profile) return;

  await markOpportunityExplored(profile.id, orgSlug);
}
