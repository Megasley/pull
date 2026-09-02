/**
 * DB-integration checks for the milestone + admin notification system.
 * Unlike tests/milestones.test.ts (pure logic, no DB), this exercises the
 * real Postgres constraints — the actual idempotency guarantee the pure
 * unit tests can't prove on their own.
 *
 * Run with: npx tsx scripts/verify-milestones.ts
 * Requires a local DB (DATABASE_URL in .env.local). Creates and cleans up
 * its own throwaway user — safe to run against local dev.
 */
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { loadEnvLocal } from "@/lib/db/load-env";
import { adminNotifications, milestoneEvents, users } from "@/lib/db/schema";
import { getAdminActivitySummary, listActivityFeed } from "@/lib/admin/activity";
import {
  countUnreadAdminNotifications,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/admin/notifications";
import { recordMilestones } from "@/lib/milestones/service";

loadEnvLocal();

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`ok — ${message}`);
}

async function main() {
  const db = getDb();

  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    username: `milestone-test-${Date.now()}`,
    displayName: "Milestone Test User",
    githubUsername: `milestone-test-${Date.now()}`,
    role: "builder",
  });

  try {
    // 1. A milestone is created correctly.
    const firstAttempt = await recordMilestones([
      {
        userId,
        milestoneType: "first_pr_opened",
        occurredAt: "2026-01-01T00:00:00.000Z",
        repository: "bitcoindevkit/bdk",
        pullRequestUrl: "https://github.com/bitcoindevkit/bdk/pull/1",
        pullRequestNumber: 1,
      },
    ]);
    assert(firstAttempt.length === 1, "first attempt creates exactly one milestone");
    assert(
      firstAttempt[0].milestoneType === "first_pr_opened",
      "created milestone has the right type",
    );
    assert(
      firstAttempt[0].repository === "bitcoindevkit/bdk",
      "created milestone carries repo context",
    );

    // 2. Admin notification created alongside it.
    const { notifications } = await listAdminNotifications({ unreadOnly: false });
    const notification = notifications.find((n) => n.subjectUserId === userId);
    assert(Boolean(notification), "admin notification created alongside the milestone");
    assert(
      notification?.description === "Milestone Test User just opened their first tracked pull request.",
      "admin notification description matches the spec's copy",
    );

    // 3. A milestone must only be created once — same call again is a no-op.
    const secondAttempt = await recordMilestones([
      {
        userId,
        milestoneType: "first_pr_opened",
        occurredAt: "2026-01-02T00:00:00.000Z", // different timestamp, same type
        repository: "different/repo",
      },
    ]);
    assert(secondAttempt.length === 0, "repeated milestone attempt creates nothing new");

    const rows = await db
      .select()
      .from(milestoneEvents)
      .where(eq(milestoneEvents.userId, userId));
    const openedRows = rows.filter((r) => r.milestoneType === "first_pr_opened");
    assert(openedRows.length === 1, "exactly one row exists in the DB, not two");
    assert(
      openedRows[0].repository === "bitcoindevkit/bdk",
      "the original row's data was not overwritten by the duplicate attempt",
    );

    const notificationCountAfterDupe = await db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.subjectUserId, userId));
    assert(
      notificationCountAfterDupe.length === 1,
      "no duplicate admin notification was created for the repeated milestone",
    );

    // 4. "Repeated GitHub syncs are idempotent" — simulate two "syncs" racing
    //    with several candidates at once, including a genuine new milestone.
    const batchResult = await recordMilestones([
      { userId, milestoneType: "first_pr_opened", occurredAt: "2026-01-03T00:00:00.000Z" },
      { userId, milestoneType: "first_pr_opened", occurredAt: "2026-01-04T00:00:00.000Z" },
      {
        userId,
        milestoneType: "first_pr_merged",
        // Real "now", not a fixed past date — the Admin Activity "today"
        // summary (step 6 below) needs this to actually fall within today.
        occurredAt: new Date().toISOString(),
        repository: "rust-bitcoin/rust-bitcoin",
      },
    ]);
    assert(
      batchResult.length === 1 && batchResult[0].milestoneType === "first_pr_merged",
      "a batch with a mix of already-achieved and new milestones only creates the new one",
    );

    // 5. Unread count updates correctly, and mark-as-read works.
    const unreadBefore = await countUnreadAdminNotifications();
    assert(unreadBefore >= 2, "unread count reflects both notifications created so far");

    const { notifications: allForUser } = await listAdminNotifications({ unreadOnly: false });
    const toMark = allForUser.find(
      (n) => n.subjectUserId === userId && n.milestoneType === "first_pr_opened",
    );
    if (!toMark) throw new Error("expected to find the first_pr_opened notification");

    await markAdminNotificationRead(toMark.id);
    const unreadAfterOne = await countUnreadAdminNotifications();
    assert(unreadAfterOne === unreadBefore - 1, "marking one notification read decrements unread count by exactly one");

    await markAllAdminNotificationsRead();
    const unreadAfterAll = await countUnreadAdminNotifications();
    assert(unreadAfterAll === 0, "mark-all-read clears the unread count entirely");

    // 6. Admin Activity metrics calculate correctly — the milestone created
    //    in step 4 (first_pr_merged) should be reflected in today's summary
    //    and in the feed, filterable by type.
    const todaySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const summary = await getAdminActivitySummary({ todaySince, weekSince: todaySince });
    assert(
      summary.milestonesAchievedToday >= 1,
      "activity summary counts at least the milestone(s) just created",
    );

    const feed = await listActivityFeed({ milestoneType: "first_pr_merged" });
    assert(
      feed.items.some((item) => item.userId === userId),
      "activity feed, filtered by type, includes the test user's merged-PR milestone",
    );
    assert(
      feed.items.every((item) => item.milestoneType === "first_pr_merged"),
      "activity feed type filter excludes other milestone types",
    );

    console.log("\nverify-milestones: all checks passed.");
  } finally {
    // Cleanup — cascades to milestone_events and admin_notifications via FK.
    await db.delete(users).where(eq(users.id, userId));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
