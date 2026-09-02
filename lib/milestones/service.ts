import { inArray } from "drizzle-orm";

import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { adminNotifications, milestoneEvents, users } from "@/lib/db/schema";
import { buildMilestoneCopy } from "./copy";
import type { MilestoneCandidate, MilestoneEventRecord, MilestoneType } from "./types";

/** Keep the earliest-occurring candidate per (user, milestone type) — if a
 *  sync batch discovers several qualifying PRs at once (e.g. a user's very
 *  first sync finds 3 already-merged PRs), the genuinely first one wins the
 *  row instead of an arbitrary one. */
function dedupeEarliest(candidates: MilestoneCandidate[]): MilestoneCandidate[] {
  const byKey = new Map<string, MilestoneCandidate>();

  for (const candidate of candidates) {
    const key = `${candidate.userId}:${candidate.milestoneType}`;
    const existing = byKey.get(key);
    if (!existing || Date.parse(candidate.occurredAt) < Date.parse(existing.occurredAt)) {
      byKey.set(key, candidate);
    }
  }

  return [...byKey.values()];
}

function toRecord(row: typeof milestoneEvents.$inferSelect): MilestoneEventRecord {
  return {
    id: row.id,
    userId: row.userId,
    milestoneType: row.milestoneType as MilestoneType,
    repository: row.repository,
    pullRequestUrl: row.pullRequestUrl,
    pullRequestNumber: row.pullRequestNumber,
    projectId: row.projectId,
    metadata: row.metadata,
    achievedAt: row.achievedAt,
  };
}

/**
 * Idempotently records milestones and, for each one newly created (not
 * already achieved), creates the matching admin notification. Safe to call
 * repeatedly with overlapping/duplicate candidates — the unique index on
 * (user_id, milestone_type) is the actual source of truth for "first"; this
 * function never needs to know whether a milestone already exists before
 * attempting the insert.
 *
 * Does not send email or touch the achievement system directly — PR-based
 * milestones share their "first" condition with an existing achievement
 * (see lib/achievements/definitions.ts), and syncGithubForUser already
 * calls syncAchievementsForUser() once per sync, which fires the
 * achievement-unlock email through the existing pipeline. Calling it again
 * here would just be redundant, not incremental.
 */
export async function recordMilestones(
  candidates: MilestoneCandidate[],
): Promise<MilestoneEventRecord[]> {
  if (!isDatabaseConfigured() || candidates.length === 0) {
    return [];
  }

  const db = getDb();
  const deduped = dedupeEarliest(candidates);
  const created: MilestoneEventRecord[] = [];

  for (const candidate of deduped) {
    const inserted = await withDbRetry(() =>
      db
        .insert(milestoneEvents)
        .values({
          userId: candidate.userId,
          milestoneType: candidate.milestoneType,
          repository: candidate.repository ?? null,
          projectId: candidate.projectId ?? null,
          pullRequestUrl: candidate.pullRequestUrl ?? null,
          pullRequestNumber: candidate.pullRequestNumber ?? null,
          metadata: candidate.metadata ?? {},
          achievedAt: candidate.occurredAt,
        })
        .onConflictDoNothing({
          target: [milestoneEvents.userId, milestoneEvents.milestoneType],
        })
        .returning(),
    );

    if (inserted.length > 0) {
      created.push(toRecord(inserted[0]));
    }
  }

  if (created.length > 0) {
    await createAdminNotifications(created);
  }

  return created;
}

async function createAdminNotifications(events: MilestoneEventRecord[]): Promise<void> {
  const db = getDb();
  const userIds = [...new Set(events.map((event) => event.userId))];

  const userRows = await withDbRetry(() =>
    db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(inArray(users.id, userIds)),
  );
  const displayNameById = new Map(userRows.map((row) => [row.id, row.displayName]));

  const values = events.map((event) => {
    const displayName = displayNameById.get(event.userId) ?? "A builder";
    const copy = buildMilestoneCopy(event.milestoneType, displayName);
    return {
      milestoneEventId: event.id,
      subjectUserId: event.userId,
      title: copy.title,
      description: copy.description,
    };
  });

  await withDbRetry(() => db.insert(adminNotifications).values(values));
}
