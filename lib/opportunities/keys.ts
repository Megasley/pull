/**
 * Stable synthetic identifiers for opportunity_events.opportunityKey.
 *
 * There is no single DB-backed "opportunity" entity in Pull today — see
 * lib/db/schema/opportunities.ts. These keys let the event log track
 * interactions consistently across the different sources opportunities
 * currently come from (admin-curated org opportunities vs. the static
 * discovery/project catalogs) without inventing a redundant table for
 * content that already lives in content/*.json or org_opportunities.
 */

export function orgOpportunityKey(orgOpportunityId: string): string {
  return `org_opportunity:${orgOpportunityId}`;
}

export function discoveryRepoKey(fullName: string): string {
  return `discovery_repo:${fullName.toLowerCase()}`;
}

export function discoveryIssueKey(issueUrl: string): string {
  return `discovery_issue:${issueUrl.toLowerCase()}`;
}

export function projectCatalogKey(projectSlug: string): string {
  return `project_catalog:${projectSlug}`;
}
