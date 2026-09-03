/**
 * One-time backfill for milestone_events / the admin activity feed.
 *
 * Why this is needed: derivePrMilestoneCandidates (lib/milestones/pr-signals.ts)
 * and recordOpportunityEvent (lib/opportunities/events.ts) only fire a
 * milestone on a state *transition* observed during a live sync/event — a PR
 * already merged as of the user's last sync before this feature shipped
 * never re-fires. So every user who contributed before the milestone system
 * deployed is invisible to the admin activity feed and notification bell,
 * even though they're verified contributors by every other measure on the
 * platform. This script closes that gap once, for existing data.
 *
 * How: for each user, treat every existing github_pull_requests row as if
 * it were "discovered" for the first time (previous: null) and run it
 * through the same derivePrMilestoneCandidates() used by live syncs, plus a
 * first_opportunity_explored candidate from each user's earliest
 * opportunity_events row. Feeding the result through recordMilestones() is
 * safe to run repeatedly and safe to run after this script — the unique
 * index on (user_id, milestone_type) means anything already recorded (by a
 * live sync, or a previous run of this script) is a no-op, not a duplicate.
 *
 * notify: false — backfilled milestones populate milestone_events (so the
 * activity feed shows the correct historical achievedAt) without creating
 * admin_notifications rows. The notification copy says "just" (e.g. "just
 * had their first PR merged"); firing that today for a months-old event
 * would be misleading and would flood the bell in one batch. See
 * lib/milestones/service.ts:recordMilestones.
 *
 * Defaults to a dry run — prints what it would create without writing.
 * Pass --write to actually persist.
 *
 * Run with: npx tsx scripts/backfill-milestones.ts [--write]
 * Requires DATABASE_URL (via .env.local, or already set in the environment
 * you're running this in — e.g. exported from `vercel env pull` output for
 * production).
 */
import { getDb } from "@/lib/db";
import { loadEnvLocal } from "@/lib/db/load-env";
import { githubPullRequests, opportunityEvents, users } from "@/lib/db/schema";
import { recordMilestones } from "@/lib/milestones/service";
import { derivePrMilestoneCandidates, type PrSyncResult } from "@/lib/milestones/pr-signals";
import type { MilestoneCandidate, MilestoneType } from "@/lib/milestones/types";
import { sql } from "drizzle-orm";

loadEnvLocal();

const WRITE = process.argv.includes("--write");

async function main() {
  const db = getDb();

  const [prRows, earliestOpportunityRows, userRows] = await Promise.all([
    db
      .select({
        userId: githubPullRequests.userId,
        githubId: githubPullRequests.githubId,
        number: githubPullRequests.number,
        merged: githubPullRequests.merged,
        draft: githubPullRequests.draft,
        repoFullName: githubPullRequests.repoFullName,
        htmlUrl: githubPullRequests.htmlUrl,
        githubCreatedAt: githubPullRequests.githubCreatedAt,
        githubMergedAt: githubPullRequests.githubMergedAt,
        isOwnRepo: githubPullRequests.isOwnRepo,
      })
      .from(githubPullRequests),
    db
      .select({
        userId: opportunityEvents.userId,
        earliestAt: sql<string>`min(${opportunityEvents.createdAt})`,
      })
      .from(opportunityEvents)
      .groupBy(opportunityEvents.userId),
    db.select({ id: users.id, username: users.username }).from(users),
  ]);

  const usernameById = new Map(userRows.map((row) => [row.id, row.username]));

  const prsByUser = new Map<string, PrSyncResult[]>();
  for (const row of prRows) {
    const list = prsByUser.get(row.userId) ?? [];
    list.push({
      pullRequestId: "", // unused by derivePrMilestoneCandidates
      previous: null, // backfill: treat every stored PR as freshly discovered
      input: {
        githubId: row.githubId,
        number: row.number,
        title: "",
        state: row.merged ? "closed" : "open",
        merged: row.merged,
        draft: row.draft,
        enriched: true,
        repoFullName: row.repoFullName,
        htmlUrl: row.htmlUrl,
        githubCreatedAt: row.githubCreatedAt,
        githubClosedAt: null,
        githubMergedAt: row.githubMergedAt,
        isOwnRepo: row.isOwnRepo,
        attributedPartnerId: null,
        attributedOpportunityEventId: null,
      },
    });
    prsByUser.set(row.userId, list);
  }

  const candidates: MilestoneCandidate[] = [];

  for (const [userId, results] of prsByUser) {
    candidates.push(...derivePrMilestoneCandidates(results, userId));
  }

  for (const row of earliestOpportunityRows) {
    candidates.push({
      userId: row.userId,
      milestoneType: "first_opportunity_explored",
      occurredAt: row.earliestAt,
    });
  }

  const countsByType = new Map<MilestoneType, number>();
  for (const candidate of candidates) {
    countsByType.set(candidate.milestoneType, (countsByType.get(candidate.milestoneType) ?? 0) + 1);
  }

  console.log(`${WRITE ? "WRITE" : "DRY RUN"} — ${candidates.length} candidates across ${prsByUser.size} users with PRs and ${earliestOpportunityRows.length} users with opportunity events.`);
  console.log("Candidates by type (before dedup/existing-row skip):");
  for (const [type, n] of countsByType) {
    console.log(`  ${type}: ${n}`);
  }

  if (!WRITE) {
    console.log("\nDry run only — pass --write to persist. Sample of first 10 candidates:");
    for (const candidate of candidates.slice(0, 10)) {
      console.log(
        `  ${usernameById.get(candidate.userId) ?? candidate.userId} — ${candidate.milestoneType} @ ${candidate.occurredAt}`,
      );
    }
    return;
  }

  const created = await recordMilestones(candidates, { notify: false });

  console.log(`\nCreated ${created.length} milestone_events rows (rest were already recorded).`);
  const createdByType = new Map<MilestoneType, number>();
  for (const record of created) {
    createdByType.set(record.milestoneType, (createdByType.get(record.milestoneType) ?? 0) + 1);
  }
  for (const [type, n] of createdByType) {
    console.log(`  ${type}: ${n}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
