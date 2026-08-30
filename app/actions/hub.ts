"use server";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { recordOpportunityEvent } from "@/lib/opportunities/events";
import { discoveryRepoKey } from "@/lib/opportunities/keys";
import { markOpportunityExplored } from "@/lib/partners/memberships";
import { getPartnerOrgBySlug } from "@/lib/partners/orgs";

function repoFullNameFromGithubUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (!/(^|\.)github\.com$/.test(url.hostname)) return null;
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    return owner && repo ? `${owner}/${repo.replace(/\.git$/, "")}` : null;
  } catch {
    return null;
  }
}

/**
 * Fired when a member clicks an opportunity link on their org hub. Silently
 * no-ops for non-members. Keeps updating the legacy `exploredOpportunityAt`
 * timestamp (still read by the partner hub checklist) and additionally
 * records a durable opportunity_events row so the interaction is queryable
 * and, when the link points at GitHub, attributable to a later PR — see
 * lib/github/attribution.ts.
 */
export async function recordOpportunityExploredAction(
  orgSlug: string,
  clickedHref?: string,
): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const profile = await bootstrapCurrentUserProfile();
  if (!profile) return;

  await markOpportunityExplored(profile.id, orgSlug);

  const org = await getPartnerOrgBySlug(orgSlug);
  if (!org) return;

  const repoFullName = clickedHref ? repoFullNameFromGithubUrl(clickedHref) : null;

  await recordOpportunityEvent({
    userId: profile.id,
    opportunityKey: repoFullName ? discoveryRepoKey(repoFullName) : `org_hub:${orgSlug}`,
    sourceType: "org_opportunity",
    eventType: repoFullName ? "clicked_github" : "viewed",
    organizationId: org.id,
    repoFullName,
  });
}
