"use server";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  recordOpportunityEvent,
  type OpportunitySourceType,
} from "@/lib/opportunities/events";

/**
 * General (non-partner) discovery click tracking — see the audit's Section F
 * finding that the public /discover and /issues catalogs had zero server-side
 * interaction tracking. Silently no-ops for signed-out visitors: this only
 * tracks a signed-in developer's journey, not anonymous traffic (that's what
 * Vercel/Google Analytics page views are for — see docs/metrics-definitions.md
 * on why those aren't used for contribution-outcome claims).
 */
export async function recordDiscoveryClickAction(input: {
  opportunityKey: string;
  sourceType: OpportunitySourceType;
  repoFullName?: string | null;
}): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const profile = await bootstrapCurrentUserProfile();
  if (!profile) return;

  await recordOpportunityEvent({
    userId: profile.id,
    opportunityKey: input.opportunityKey,
    sourceType: input.sourceType,
    eventType: "clicked_github",
    repoFullName: input.repoFullName ?? null,
  });
}
