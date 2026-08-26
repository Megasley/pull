import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orgOpportunities } from "@/lib/db/schema";
import { getAllDiscoveryRepositories } from "@/lib/discovery/catalog";
import { getAllCuratedIssues } from "@/lib/issues/engine";
import type { DiscoveryRepository } from "@/types/discovery";
import type { CuratedIssue } from "@/types/issues";

export type Opportunity = typeof orgOpportunities.$inferSelect;

export async function listOpportunitiesForOrg(organizationId: string): Promise<Opportunity[]> {
  const db = getDb();
  return await db
    .select()
    .from(orgOpportunities)
    .where(eq(orgOpportunities.organizationId, organizationId))
    .orderBy(
      // Pinned first, then by sort order
      asc(orgOpportunities.isPinned),
      asc(orgOpportunities.sortOrder),
    );
}

export async function createOpportunity(
  organizationId: string,
  input: {
    title: string;
    description?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    skills?: string[];
    contributionType?: string;
    repositoryUrl?: string;
    issueUrl?: string;
    whyRecommended?: string;
    isPinned?: boolean;
    sortOrder?: number;
  },
): Promise<Opportunity> {
  const db = getDb();
  const [row] = await db
    .insert(orgOpportunities)
    .values({
      organizationId,
      title: input.title,
      description: input.description ?? "",
      difficulty: input.difficulty ?? "beginner",
      skills: input.skills ?? [],
      contributionType: input.contributionType ?? null,
      repositoryUrl: input.repositoryUrl ?? null,
      issueUrl: input.issueUrl ?? null,
      whyRecommended: input.whyRecommended ?? null,
      isPinned: input.isPinned ?? false,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row;
}

export async function updateOpportunity(
  id: string,
  input: Partial<Omit<Opportunity, "id" | "organizationId" | "createdAt">>,
): Promise<Opportunity> {
  const db = getDb();
  const [row] = await db
    .update(orgOpportunities)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(orgOpportunities.id, id))
    .returning();
  return row;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const db = getDb();
  await db.delete(orgOpportunities).where(eq(orgOpportunities.id, id));
}

/**
 * Simple skill-overlap matching — returns org opportunities sorted by how
 * many skills overlap with the user's profile skills. No AI required for V1.
 */
export async function getRecommendedOpportunities(
  organizationId: string,
  userSkills: string[],
): Promise<Opportunity[]> {
  const opportunities = await listOpportunitiesForOrg(organizationId);
  if (opportunities.length === 0) return [];

  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase());

  const scored = opportunities.map((opp) => {
    const oppSkills = (opp.skills as string[]).map((s) => s.toLowerCase());
    const overlap = oppSkills.filter((s) => normalizedUserSkills.includes(s)).length;
    return { opp, overlap };
  });

  // Pinned items always first, then sorted by skill overlap desc
  scored.sort((a, b) => {
    if (a.opp.isPinned && !b.opp.isPinned) return -1;
    if (!a.opp.isPinned && b.opp.isPinned) return 1;
    return b.overlap - a.overlap;
  });

  return scored.map((s) => s.opp);
}

// ─── Fallback suggestions ───────────────────────────────────────────────────
// Real external open source repositories + real curated issues, filtered by
// skill relevance — used when an org has no hand-curated opportunities yet,
// so a participant's hub never shows an empty list just because nobody has
// curated it manually. Deliberately NOT sourced from Pull's own internal
// practice-project catalog (`lib/projects`) — those are guided learning
// exercises submitted back to Pull, not actual open source contributions.

export type SuggestedOpportunity =
  | { kind: "repository"; repository: DiscoveryRepository }
  | { kind: "issue"; issue: CuratedIssue };

function matchesSkills(itemTags: string[], lowerSkills: string[]): boolean {
  return itemTags.some((tag) =>
    lowerSkills.some((skill) => tag.toLowerCase().includes(skill)),
  );
}

/** Real external OSS repositories relevant to a set of skills — no invented data. */
export function pickRelevantRepositories(skills: string[], limit = 3): DiscoveryRepository[] {
  const lower = skills.map((s) => s.toLowerCase());
  if (lower.length === 0) return [];

  const matches = getAllDiscoveryRepositories().filter(
    (repo) =>
      matchesSkills(repo.topics, lower) ||
      matchesSkills(repo.tracks, lower) ||
      matchesSkills([repo.language], lower),
  );

  matches.sort((a, b) => {
    const aLang = a.language.toLowerCase().includes("rust") ? 1 : 0;
    const bLang = b.language.toLowerCase().includes("rust") ? 1 : 0;
    return bLang - aLang;
  });

  return matches.slice(0, limit);
}

/** Real curated issues relevant to a set of skills — matches on both skill tags and track. */
function pickRelevantIssues(skills: string[], limit = 3): CuratedIssue[] {
  const lower = skills.map((s) => s.toLowerCase());
  if (lower.length === 0) return [];

  const matches = getAllCuratedIssues().filter(
    (issue) => matchesSkills(issue.skills, lower) || matchesSkills(issue.tracks, lower),
  );

  matches.sort((a, b) => {
    const aSkill = a.skills.some((s) => matchesSkills([s], lower)) ? 1 : 0;
    const bSkill = b.skills.some((s) => matchesSkills([s], lower)) ? 1 : 0;
    return bSkill - aSkill;
  });

  return matches.slice(0, limit);
}

/**
 * Default opportunity suggestions for a set of skills (e.g. a partner's
 * learning-path skills) — a mix of real external repositories and real
 * curated issues. Used as a fallback when an org has no `org_opportunities`
 * curated yet.
 */
export function getSuggestedOpportunities(
  skills: string[],
  limit = 12,
): SuggestedOpportunity[] {
  const repositories = pickRelevantRepositories(skills, Math.ceil(limit / 2)).map(
    (repository): SuggestedOpportunity => ({ kind: "repository", repository }),
  );
  const issues = pickRelevantIssues(skills, limit - repositories.length).map(
    (issue): SuggestedOpportunity => ({ kind: "issue", issue }),
  );

  return [...repositories, ...issues];
}
