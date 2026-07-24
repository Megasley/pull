import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getProjectBySlug } from "@/lib/projects/catalog";

function nowIso() {
  return new Date().toISOString();
}

export async function ensureProjectRecord(slug: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const catalogItem = getProjectBySlug(slug);

  if (!catalogItem) {
    return null;
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (existing[0]) {
    const timestamp = nowIso();
    const [updated] = await db
      .update(projects)
      .set({
        title: catalogItem.title,
        description: catalogItem.description,
        difficulty: catalogItem.difficulty,
        estimatedDuration: catalogItem.estimatedTime,
        updatedAt: timestamp,
      })
      .where(eq(projects.id, existing[0].id))
      .returning();

    return updated ?? existing[0];
  }

  const [created] = await db
    .insert(projects)
    .values({
      slug: catalogItem.slug,
      title: catalogItem.title,
      description: catalogItem.description,
      difficulty: catalogItem.difficulty,
      estimatedDuration: catalogItem.estimatedTime,
    })
    .returning();

  return created ?? null;
}
