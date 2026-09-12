/**
 * One-time backfill for pr_review_requests.pr_created_at.
 *
 * Why this is needed: the age-based filter on the public review queue
 * (lib/pr-reviews/repository.ts:listReviewRequestsForViewer) hides any
 * admin_curated/ecosystem PR whose real GitHub open date is older than 4
 * months. That column didn't exist before migration 0035, so every row
 * inserted before that migration shipped has pr_created_at = NULL and falls
 * back to its own (recent) created_at — meaning genuinely old PRs discovered
 * before the fix keep showing up, since nothing else ever re-touches an
 * existing row. This script fetches each such row's real GitHub PR date
 * once and fills it in, so the filter can actually see how old they are.
 *
 * Safe to run repeatedly — only rows with pr_created_at IS NULL are touched.
 *
 * Defaults to a dry run — prints what it would update without writing.
 * Pass --write to actually persist.
 */
import { eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { prReviewRequests } from "@/lib/db/schema";
import { GithubClient } from "@/lib/github/client";
import { fetchPullRequestByUrl } from "@/lib/github/api";

const WRITE = process.argv.includes("--write");

// Unauthenticated GitHub search/REST is capped at 60 requests/hour — pace
// requests comfortably under that so a large backlog doesn't get rate
// limited partway through. Set GITHUB_DISCOVERY_TOKEN for a higher budget.
const DELAY_MS = process.env.GITHUB_DISCOVERY_TOKEN ? 250 : 1200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const db = getDb();
  const rows = await db
    .select({
      id: prReviewRequests.id,
      repoFullName: prReviewRequests.repoFullName,
      number: prReviewRequests.number,
      title: prReviewRequests.title,
    })
    .from(prReviewRequests)
    .where(isNull(prReviewRequests.prCreatedAt));

  console.log(`${WRITE ? "WRITE" : "DRY RUN"} — ${rows.length} rows missing pr_created_at.`);

  if (rows.length === 0) {
    return;
  }

  const client = new GithubClient(process.env.GITHUB_DISCOVERY_TOKEN ?? "");
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    const [owner, repo] = row.repoFullName.split("/");
    try {
      const pr = await fetchPullRequestByUrl(client, owner, repo, row.number);
      console.log(
        `  ${row.repoFullName} #${row.number} -> ${pr.githubCreatedAt} (${row.title.slice(0, 60)})`,
      );

      if (WRITE) {
        await db
          .update(prReviewRequests)
          .set({ prCreatedAt: pr.githubCreatedAt })
          .where(eq(prReviewRequests.id, row.id));
      }
      updated += 1;
    } catch (error) {
      failed += 1;
      console.warn(
        `  FAILED ${row.repoFullName} #${row.number}:`,
        error instanceof Error ? error.message : error,
      );
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\n${WRITE ? "Updated" : "Would update"} ${updated} row(s), ${failed} failed lookup(s).`,
  );
  if (!WRITE) {
    console.log("Dry run only — pass --write to persist.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
