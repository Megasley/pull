import { and, count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { projectSubmissions, projects, users } from "@/lib/db/schema";
import type { BuilderProfile } from "@/types/user";
import { mapBuilderProfile, type BuilderProfileRow } from "@/types/user";

function mapDrizzleUser(row: typeof users.$inferSelect): BuilderProfile {
  return mapBuilderProfile({
    id: row.id,
    username: row.username,
    display_name: row.displayName,
    avatar: row.avatar,
    bio: row.bio,
    github_username: row.githubUsername,
    email: row.email,
    website: row.website,
    twitter_url: row.twitterUrl,
    linkedin_url: row.linkedinUrl,
    skills: Array.isArray(row.skills) ? row.skills : [],
    email_notifications: row.emailNotifications,
    role: row.role,
    xp: row.xp,
    level: row.level,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  });
}

export async function getUserByUsername(
  username: string,
): Promise<BuilderProfile | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = ${username.toLowerCase()}`)
    .limit(1);

  return rows[0] ? mapDrizzleUser(rows[0]) : null;
}

export async function getApprovedSubmissionCount(userId: string) {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.userId, userId),
        eq(projectSubmissions.status, "approved"),
      ),
    );

  return Number(rows[0]?.value ?? 0);
}

export async function listApprovedSubmissionsForUser(userId: string) {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  return db
    .select({
      id: projectSubmissions.id,
      status: projectSubmissions.status,
      repoUrl: projectSubmissions.repoUrl,
      projectSlug: projects.slug,
      projectTitle: projects.title,
      submittedAt: projectSubmissions.submittedAt,
      reviewedAt: projectSubmissions.reviewedAt,
      updatedAt: projectSubmissions.updatedAt,
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .where(
      and(
        eq(projectSubmissions.userId, userId),
        eq(projectSubmissions.status, "approved"),
      ),
    )
    .orderBy(desc(projectSubmissions.reviewedAt), desc(projectSubmissions.updatedAt));
}

export async function updateBuilderProfileFields(
  userId: string,
  input: {
    displayName: string;
    bio: string;
    website: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    skills: string[];
  },
): Promise<BuilderProfile | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({
      displayName: input.displayName,
      bio: input.bio,
      website: input.website,
      twitterUrl: input.twitterUrl,
      linkedinUrl: input.linkedinUrl,
      skills: input.skills,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated ? mapDrizzleUser(updated) : null;
}

/** Supabase row helper kept for auth path mapping */
export function mapSupabaseProfileRow(row: BuilderProfileRow): BuilderProfile {
  return mapBuilderProfile(row);
}
