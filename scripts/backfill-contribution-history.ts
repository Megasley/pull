/**
 * One-time, idempotent backfill for the durable contribution history.
 *
 * Safe to re-run: every write here is either a plain column recompute (pure
 * function of already-stored data) or an event insert guarded by the
 * unique(pullRequestId, eventType) constraint via onConflictDoNothing.
 * Nothing is deleted. No timestamp is invented — see the explicit skip of
 * "ready_for_review" backfill below.
 *
 * Run with: npx tsx scripts/backfill-contribution-history.ts [--dry-run]
 */
import { eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { loadEnvLocal } from "@/lib/db/load-env";
import {
  githubConnections,
  githubPullRequestEvents,
  githubPullRequests,
} from "@/lib/db/schema";
import { resolvePartnerAttribution, type PartnerMembershipForAttribution } from "@/lib/github/attribution";

loadEnvLocal();

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 200;

async function main() {
  const db = getDb();

  console.log(DRY_RUN ? "Dry run — no writes will be made.\n" : "Backfilling…\n");

  // 1. isOwnRepo — pure function of (repoFullName, connected login). The
  //    column defaulted to false for every pre-existing row; recompute it
  //    properly. Safe to recompute unconditionally (idempotent by nature).
  const prRows = await db
    .select({
      id: githubPullRequests.id,
      userId: githubPullRequests.userId,
      repoFullName: githubPullRequests.repoFullName,
      isOwnRepo: githubPullRequests.isOwnRepo,
    })
    .from(githubPullRequests);

  const loginByUserId = new Map<string, string>();
  const connections = await db
    .select({ userId: githubConnections.userId, login: githubConnections.login })
    .from(githubConnections);
  for (const conn of connections) loginByUserId.set(conn.userId, conn.login);

  let isOwnRepoUpdates = 0;
  for (const pr of prRows) {
    const login = loginByUserId.get(pr.userId);
    if (!login) continue;
    const owner = pr.repoFullName.split("/")[0]?.toLowerCase();
    const correct = owner === login.toLowerCase();
    if (correct !== pr.isOwnRepo) {
      isOwnRepoUpdates += 1;
      if (!DRY_RUN) {
        await db.update(githubPullRequests).set({ isOwnRepo: correct }).where(eq(githubPullRequests.id, pr.id));
      }
    }
  }
  console.log(`isOwnRepo: ${isOwnRepoUpdates} row(s) ${DRY_RUN ? "would be" : "were"} corrected.`);

  // 2. firstSyncedAt — best available proxy for pre-existing rows is
  //    GitHub's own created_at timestamp (closer to truth than "whenever
  //    this script happens to run"), explicitly documented as backfilled
  //    rather than observed. New rows get this set precisely at insert time
  //    going forward — see lib/github/store.ts:upsertGithubPullRequests.
  const missingFirstSynced = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(githubPullRequests)
    .where(isNull(githubPullRequests.firstSyncedAt));
  const missingCount = Number(missingFirstSynced[0]?.value ?? 0);
  console.log(`firstSyncedAt: ${missingCount} row(s) missing, backfilling from githubCreatedAt (documented approximation).`);
  if (!DRY_RUN && missingCount > 0) {
    await db.execute(sql`
      UPDATE ${githubPullRequests}
      SET first_synced_at = COALESCE(${githubPullRequests.githubCreatedAt}, ${githubPullRequests.syncedAt})
      WHERE first_synced_at IS NULL
    `);
  }

  // 3. attributedPartnerId — set once, only where still null (never
  //    overwrites a value the live sync may have already assigned).
  const membershipsByUser = await loadMembershipsByUser(db);
  let attributionUpdates = 0;
  const unattributed = await db
    .select({
      id: githubPullRequests.id,
      userId: githubPullRequests.userId,
      githubCreatedAt: githubPullRequests.githubCreatedAt,
    })
    .from(githubPullRequests)
    .where(isNull(githubPullRequests.attributedPartnerId));

  for (const pr of unattributed) {
    const memberships = membershipsByUser.get(pr.userId) ?? [];
    if (memberships.length === 0) continue;
    const partnerId = resolvePartnerAttribution(memberships, pr.githubCreatedAt);
    if (!partnerId) continue;
    attributionUpdates += 1;
    if (!DRY_RUN) {
      await db
        .update(githubPullRequests)
        .set({ attributedPartnerId: partnerId })
        .where(eq(githubPullRequests.id, pr.id));
    }
  }
  console.log(`attributedPartnerId: ${attributionUpdates} row(s) ${DRY_RUN ? "would be" : "were"} attributed.`);

  // 4. Lifecycle events — opened/merged/closed from real GitHub timestamps.
  //    "ready_for_review" is intentionally NOT backfilled: no historical
  //    draft->ready timestamp exists for pre-existing rows, and inventing
  //    one would violate the "don't invent missing timestamps" rule. It
  //    will only start recording going forward, from a real sync-detected
  //    transition — see lib/github/store.ts:deriveLifecycleEvents.
  const allPrs = await db
    .select({
      id: githubPullRequests.id,
      userId: githubPullRequests.userId,
      state: githubPullRequests.state,
      merged: githubPullRequests.merged,
      githubCreatedAt: githubPullRequests.githubCreatedAt,
      githubMergedAt: githubPullRequests.githubMergedAt,
      githubClosedAt: githubPullRequests.githubClosedAt,
    })
    .from(githubPullRequests);

  let eventsInserted = 0;
  for (let i = 0; i < allPrs.length; i += BATCH_SIZE) {
    const batch = allPrs.slice(i, i + BATCH_SIZE);
    const events: Array<typeof githubPullRequestEvents.$inferInsert> = [];

    for (const pr of batch) {
      if (pr.githubCreatedAt) {
        events.push({
          pullRequestId: pr.id,
          userId: pr.userId,
          eventType: "opened",
          occurredAt: pr.githubCreatedAt,
          timestampSource: "github",
        });
      }
      if (pr.merged && pr.githubMergedAt) {
        events.push({
          pullRequestId: pr.id,
          userId: pr.userId,
          eventType: "merged",
          occurredAt: pr.githubMergedAt,
          timestampSource: "github",
        });
      } else if (pr.state === "closed" && pr.githubClosedAt) {
        events.push({
          pullRequestId: pr.id,
          userId: pr.userId,
          eventType: "closed",
          occurredAt: pr.githubClosedAt,
          timestampSource: "github",
        });
      }
    }

    if (events.length === 0) continue;
    if (DRY_RUN) {
      // No reliable way to know which would conflict without writing —
      // report the candidate count, explicitly framed as an upper bound.
      eventsInserted += events.length;
      continue;
    }
    const inserted = await db
      .insert(githubPullRequestEvents)
      .values(events)
      .onConflictDoNothing({
        target: [githubPullRequestEvents.pullRequestId, githubPullRequestEvents.eventType],
      })
      .returning({ id: githubPullRequestEvents.id });
    eventsInserted += inserted.length;
  }
  console.log(
    DRY_RUN
      ? `Lifecycle events: up to ${eventsInserted} row(s) would be considered (existing ones are skipped automatically; exact count only known once run for real).`
      : `Lifecycle events: ${eventsInserted} new row(s) were inserted (already-recorded ones were safely skipped).`,
  );

  console.log(`\nDone. Processed ${allPrs.length} pull request(s) across ${loginByUserId.size} connected account(s).`);
  process.exit(0);
}

async function loadMembershipsByUser(
  db: ReturnType<typeof getDb>,
): Promise<Map<string, PartnerMembershipForAttribution[]>> {
  const { orgMemberships } = await import("@/lib/db/schema");
  const rows = await db
    .select({ userId: orgMemberships.userId, organizationId: orgMemberships.organizationId, joinedAt: orgMemberships.joinedAt })
    .from(orgMemberships);

  const byUser = new Map<string, PartnerMembershipForAttribution[]>();
  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push({ organizationId: row.organizationId, joinedAt: row.joinedAt });
    byUser.set(row.userId, list);
  }
  return byUser;
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
