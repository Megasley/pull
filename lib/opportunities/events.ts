import { and, count, desc, eq, gte } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { opportunityEvents } from "@/lib/db/schema";
import { recordMilestones } from "@/lib/milestones/service";

/** "Viewed" events within this window for the same (user, opportunity) are
 *  deduped to one row — avoids a burst of rows from page refreshes/re-renders
 *  while still letting genuinely separate visits register as new views. */
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

export type OpportunitySourceType =
  | "org_opportunity"
  | "discovery_repo"
  | "discovery_issue"
  | "project_catalog";

export type OpportunityEventType = "viewed" | "clicked_github" | "saved" | "showed_interest";

export type RecordOpportunityEventInput = {
  userId: string;
  opportunityKey: string;
  sourceType: OpportunitySourceType;
  eventType: OpportunityEventType;
  organizationId?: string | null;
  repoFullName?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Durable, first-party server-side opportunity interaction log (Phase 7).
 * "saved" / "showed_interest" always insert a new row — the current state
 * is "whatever the latest row says," so toggling save/unsave stays a
 * reconstructable history rather than a single overwritten flag. "viewed"
 * is deduped per VIEW_DEDUP_WINDOW_MS so refreshes don't inflate counts.
 */
export async function recordOpportunityEvent(input: RecordOpportunityEventInput): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const db = getDb();

  if (input.eventType === "viewed") {
    const since = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS).toISOString();
    const [recent] = await db
      .select({ id: opportunityEvents.id })
      .from(opportunityEvents)
      .where(
        and(
          eq(opportunityEvents.userId, input.userId),
          eq(opportunityEvents.opportunityKey, input.opportunityKey),
          eq(opportunityEvents.eventType, "viewed"),
          gte(opportunityEvents.createdAt, since),
        ),
      )
      .orderBy(desc(opportunityEvents.createdAt))
      .limit(1);
    if (recent) return;
  }

  // Checked before inserting (not "count === 1 after") so a concurrent
  // duplicate request can't skip the milestone attempt — recordMilestones'
  // unique(user_id, milestone_type) constraint is what actually guarantees
  // exactly one milestone/notification even if two requests both see zero
  // prior rows and both attempt it.
  const [{ value: priorCount }] = await db
    .select({ value: count() })
    .from(opportunityEvents)
    .where(eq(opportunityEvents.userId, input.userId));
  const isFirstEver = priorCount === 0;

  await db.insert(opportunityEvents).values({
    userId: input.userId,
    opportunityKey: input.opportunityKey,
    sourceType: input.sourceType,
    eventType: input.eventType,
    organizationId: input.organizationId ?? null,
    repoFullName: input.repoFullName ?? null,
    metadata: input.metadata ?? {},
  });

  if (isFirstEver) {
    await recordMilestones([
      {
        userId: input.userId,
        milestoneType: "first_opportunity_explored",
        occurredAt: new Date().toISOString(),
        repository: input.repoFullName ?? null,
        metadata: { opportunityKey: input.opportunityKey, sourceType: input.sourceType },
      },
    ]);
  }
}
