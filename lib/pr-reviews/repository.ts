import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { prReviewRequests, users } from "@/lib/db/schema";
import { getAllDiscoveryRepositories } from "@/lib/discovery/catalog";
// Import from these concrete lib/github submodules, NOT the @/lib/github
// barrel: the barrel re-exports lib/github/service.ts, which imports
// lib/github/sync.ts, which imports THIS file (for the credit-detection
// hook) — going through the barrel here would be a circular import.
import { fetchPullRequestByUrl } from "@/lib/github/api";
import { GithubClient } from "@/lib/github/client";
import { getGithubConnection } from "@/lib/github/store";
import { parsePrUrl } from "@/lib/pr-reviews/validate";
import { notifyPrReviewCompletedAsync } from "@/lib/notifications/dispatch";
import { getReputationScore } from "@/lib/reputation";
import type { DiscoveryTrack } from "@/types/discovery";
import { prReviewXpKey } from "@/lib/xp/config";
import { awardXp } from "@/lib/xp/repository";

/** Track/language are looked up from the same ecosystem catalog the
 *  "Discover" page uses (content/discovery/repositories.json), keyed by
 *  repoFullName — not stored on the row, so they can't drift out of sync
 *  with the catalog. A peer-submitted PR on a repo outside the catalog
 *  (any GitHub repo can be submitted, not just the 20 curated ones) simply
 *  has no track/language — filterable as "Other"/unset. */
function lookupCatalogMeta(repoFullName: string): {
  tracks: DiscoveryTrack[];
  language: string | null;
} {
  const repo = getAllDiscoveryRepositories().find(
    (item) => item.repository === repoFullName,
  );
  return { tracks: repo?.tracks ?? [], language: repo?.language ?? null };
}

/** Below this reputation score, a peer-submitted PR gets flagged for an
 *  admin's first look instead of being silently trusted — auto-publish
 *  still happens either way, this only affects the admin moderation view. */
const FLAG_REPUTATION_THRESHOLD = 20;

const RATE_LIMIT_WINDOW_SECONDS = 30;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;

/** PRs open on GitHub longer than this drop out of the public queue — an
 *  old, unreviewed PR is more likely abandoned/stale than worth suggesting.
 *  Measured from when the PR was actually opened on GitHub (`prCreatedAt`),
 *  not when Pull found or was told about it — falls back to `createdAt` for
 *  rows inserted before that was tracked. Doesn't change `status` or affect
 *  the admin/"my submissions" views, purely a display-age cutoff on what
 *  gets suggested. */
const MAX_SUGGESTED_PR_AGE_MONTHS = 4;

/** Only applied to peer submissions — the public-facing, anyone-can-hit
 *  form is the actual abuse vector. Admin curation is role-gated already
 *  and an admin bulk-adding several real PRs in a row is normal, not spam. */
async function isRateLimited(userId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(prReviewRequests)
    .where(
      and(
        eq(prReviewRequests.submittedByUserId, userId),
        sql`${prReviewRequests.createdAt} > now() - (${RATE_LIMIT_WINDOW_SECONDS} || ' seconds')::interval`,
      ),
    );
  return (rows[0]?.count ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS;
}

export type CreateReviewRequestResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: "invalid_url" | "github_not_connected" | "pr_not_found" | "rate_limited";
    };

export async function createReviewRequest(input: {
  prUrl: string;
  sourceType: "admin_curated" | "peer_submitted";
  submittedByUserId: string;
}): Promise<CreateReviewRequestResult> {
  const parsed = parsePrUrl(input.prUrl);
  if (!parsed) {
    return { ok: false, reason: "invalid_url" };
  }

  if (
    input.sourceType === "peer_submitted" &&
    (await isRateLimited(input.submittedByUserId))
  ) {
    return { ok: false, reason: "rate_limited" };
  }

  const connection = await getGithubConnection(input.submittedByUserId);
  const accessToken = connection?.accessToken ?? null;
  if (!accessToken) {
    return { ok: false, reason: "github_not_connected" };
  }

  const client = new GithubClient(accessToken);
  let pr;
  try {
    pr = await fetchPullRequestByUrl(client, parsed.owner, parsed.repo, parsed.number);
  } catch {
    return { ok: false, reason: "pr_not_found" };
  }

  const flaggedForReview =
    input.sourceType === "peer_submitted"
      ? (await getReputationScore(input.submittedByUserId)) < FLAG_REPUTATION_THRESHOLD
      : false;

  const db = getDb();
  const [row] = await db
    .insert(prReviewRequests)
    .values({
      prUrl: input.prUrl,
      repoFullName: parsed.repoFullName,
      number: parsed.number,
      title: pr.title,
      authorLogin: pr.authorLogin,
      prCreatedAt: pr.githubCreatedAt,
      sourceType: input.sourceType,
      submittedByUserId: input.submittedByUserId,
      flaggedForReview,
    })
    .returning({ id: prReviewRequests.id });

  return { ok: true, id: row.id };
}

export type PrReviewRequestRecord = {
  id: string;
  prUrl: string;
  repoFullName: string;
  number: number;
  title: string;
  authorLogin: string;
  sourceType: "admin_curated" | "peer_submitted";
  status: "needs_review" | "reviewed" | "closed" | "hidden";
  /** Distinguishes a user's own voluntary withdrawal ("withdrawn") from an
   *  admin hiding it for cause — only the former can be self-restored. */
  hiddenReason: string | null;
  submittedByUsername: string | null;
  createdAt: string;
  /** When the PR was actually opened on GitHub — null for rows inserted
   *  before this was tracked. */
  prCreatedAt: string | null;
  flaggedForReview: boolean;
  tracks: DiscoveryTrack[];
  language: string | null;
};

function mapRequestRow(row: {
  request: typeof prReviewRequests.$inferSelect;
  submittedByUsername: string | null;
}): PrReviewRequestRecord {
  return {
    id: row.request.id,
    prUrl: row.request.prUrl,
    repoFullName: row.request.repoFullName,
    number: row.request.number,
    title: row.request.title,
    authorLogin: row.request.authorLogin,
    sourceType: row.request.sourceType,
    status: row.request.status,
    hiddenReason: row.request.hiddenReason,
    submittedByUsername: row.submittedByUsername,
    createdAt: row.request.createdAt,
    prCreatedAt: row.request.prCreatedAt,
    flaggedForReview: row.request.flaggedForReview,
    ...lookupCatalogMeta(row.request.repoFullName),
  };
}

/**
 * Open requests for a viewer to pick up — excludes the viewer's own PRs
 * (matched on GitHub login, not on who submitted the listing) and orders
 * peer-submitted requests above admin-curated ones, oldest first within
 * each group so nothing silently rots at the bottom.
 */
export async function listReviewRequestsForViewer(
  viewerGithubUsername: string | null,
): Promise<PrReviewRequestRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const conditions = [
    eq(prReviewRequests.status, "needs_review"),
    // Peer submissions are exempt — a builder asking for a review on their
    // own PR should never be hidden just because the PR itself is old; the
    // age cutoff only exists to keep stale, nobody-asked-for-it ecosystem/
    // admin-curated entries from cluttering the queue.
    sql`(
      ${prReviewRequests.sourceType} = 'peer_submitted'
      or coalesce(${prReviewRequests.prCreatedAt}, ${prReviewRequests.createdAt})
         >= now() - (${MAX_SUGGESTED_PR_AGE_MONTHS} || ' months')::interval
    )`,
  ];
  if (viewerGithubUsername) {
    conditions.push(ne(prReviewRequests.authorLogin, viewerGithubUsername));
  }

  const rows = await db
    .select({
      request: prReviewRequests,
      submittedByUsername: users.username,
    })
    .from(prReviewRequests)
    .leftJoin(users, eq(prReviewRequests.submittedByUserId, users.id))
    .where(and(...conditions))
    .orderBy(
      sql`case when ${prReviewRequests.sourceType} = 'peer_submitted' then 0 else 1 end`,
      asc(prReviewRequests.createdAt),
    );

  return rows.map(mapRequestRow);
}

/** Every open request, for the admin management view — unlike
 *  `listReviewRequestsForViewer`, not filtered to exclude anyone's own PRs
 *  and not restricted to flagged ones; admins can hide any of them. */
/** Every request regardless of status — including hidden/closed/reviewed
 *  ones — for the admin management view. Unlike `listReviewRequestsForViewer`
 *  (which only shows what's actually pickable right now), an admin needs to
 *  see everything to be able to unhide something that was hidden by
 *  mistake, or just audit history. */
export async function listAllReviewRequests(): Promise<PrReviewRequestRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      request: prReviewRequests,
      submittedByUsername: users.username,
    })
    .from(prReviewRequests)
    .leftJoin(users, eq(prReviewRequests.submittedByUserId, users.id))
    .orderBy(
      sql`case when ${prReviewRequests.flaggedForReview} then 0 else 1 end`,
      sql`case when ${prReviewRequests.status} = 'needs_review' then 0 else 1 end`,
      desc(prReviewRequests.createdAt),
    );

  return rows.map(mapRequestRow);
}

export type HideReviewRequestResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export async function hideReviewRequest(input: {
  id: string;
  reason: string;
}): Promise<HideReviewRequestResult> {
  const db = getDb();
  const existing = await db
    .select({ id: prReviewRequests.id })
    .from(prReviewRequests)
    .where(eq(prReviewRequests.id, input.id))
    .limit(1);

  if (!existing[0]) {
    return { ok: false, reason: "not_found" };
  }

  await db
    .update(prReviewRequests)
    .set({
      status: "hidden",
      hiddenAt: new Date().toISOString(),
      hiddenReason: input.reason,
    })
    .where(eq(prReviewRequests.id, input.id));

  return { ok: true };
}

export type UnhideReviewRequestResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

/** Restores a hidden request back to the open queue — for undoing an
 *  admin hide (or a user's own withdrawal) by mistake. Always goes back to
 *  "needs_review", regardless of who/why it was hidden. */
export async function unhideReviewRequest(
  id: string,
): Promise<UnhideReviewRequestResult> {
  const db = getDb();
  const existing = await db
    .select({ id: prReviewRequests.id })
    .from(prReviewRequests)
    .where(and(eq(prReviewRequests.id, id), eq(prReviewRequests.status, "hidden")))
    .limit(1);

  if (!existing[0]) {
    return { ok: false, reason: "not_found" };
  }

  await db
    .update(prReviewRequests)
    .set({ status: "needs_review", hiddenAt: null, hiddenReason: null })
    .where(eq(prReviewRequests.id, id));

  return { ok: true };
}

export type MyReviewRequestRecord = PrReviewRequestRecord & {
  reviewedByUsername: string | null;
};

/** Every PR a user has personally submitted (any status), for their own
 *  "my submissions" view — regardless of source type, so an admin checking
 *  their own admin-curated adds sees them too. */
export async function listMySubmissions(userId: string): Promise<MyReviewRequestRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const submitter = alias(users, "submitter");
  const reviewer = alias(users, "reviewer");
  const rows = await db
    .select({
      request: prReviewRequests,
      submittedByUsername: submitter.username,
      reviewedByUsername: reviewer.username,
    })
    .from(prReviewRequests)
    .leftJoin(submitter, eq(prReviewRequests.submittedByUserId, submitter.id))
    .leftJoin(reviewer, eq(prReviewRequests.reviewedByUserId, reviewer.id))
    .where(eq(prReviewRequests.submittedByUserId, userId))
    .orderBy(desc(prReviewRequests.createdAt));

  return rows.map((row) => ({
    ...mapRequestRow(row),
    reviewedByUsername: row.reviewedByUsername,
  }));
}

export type WithdrawReviewRequestResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_owner" };

/** Self-service version of `hideReviewRequest` — a builder withdrawing
 *  their own submission, vs. an admin moderating someone else's. Same
 *  "hidden" status either way; this view doesn't need to distinguish who
 *  hid it. */
export async function withdrawOwnReviewRequest(input: {
  id: string;
  userId: string;
}): Promise<WithdrawReviewRequestResult> {
  const db = getDb();
  const existing = await db
    .select({ id: prReviewRequests.id, submittedByUserId: prReviewRequests.submittedByUserId })
    .from(prReviewRequests)
    .where(eq(prReviewRequests.id, input.id))
    .limit(1);

  if (!existing[0]) {
    return { ok: false, reason: "not_found" };
  }
  if (existing[0].submittedByUserId !== input.userId) {
    return { ok: false, reason: "not_owner" };
  }

  await db
    .update(prReviewRequests)
    .set({ status: "hidden", hiddenAt: new Date().toISOString(), hiddenReason: "withdrawn" })
    .where(eq(prReviewRequests.id, input.id));

  return { ok: true };
}

export type RestoreReviewRequestResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_owner" | "not_withdrawn" };

/**
 * A user bringing back their own voluntarily-withdrawn submission — the
 * self-service mirror of `withdrawOwnReviewRequest`. Deliberately does NOT
 * work on a request an admin hid for cause (`hiddenReason !== "withdrawn"`):
 * that's an admin moderation decision, not something the submitter should
 * be able to silently override. Admins restore those via `unhideReviewRequest`.
 */
export async function restoreOwnReviewRequest(input: {
  id: string;
  userId: string;
}): Promise<RestoreReviewRequestResult> {
  const db = getDb();
  const existing = await db
    .select({
      id: prReviewRequests.id,
      submittedByUserId: prReviewRequests.submittedByUserId,
      status: prReviewRequests.status,
      hiddenReason: prReviewRequests.hiddenReason,
    })
    .from(prReviewRequests)
    .where(eq(prReviewRequests.id, input.id))
    .limit(1);

  if (!existing[0]) {
    return { ok: false, reason: "not_found" };
  }
  if (existing[0].submittedByUserId !== input.userId) {
    return { ok: false, reason: "not_owner" };
  }
  if (existing[0].status !== "hidden" || existing[0].hiddenReason !== "withdrawn") {
    return { ok: false, reason: "not_withdrawn" };
  }

  await db
    .update(prReviewRequests)
    .set({ status: "needs_review", hiddenAt: null, hiddenReason: null })
    .where(eq(prReviewRequests.id, input.id));

  return { ok: true };
}

/**
 * The credit-detection loop: called from lib/github/sync.ts right after a
 * user's GitHub sync refreshes their own reviewed-PR list. Cross-references
 * those freshly-synced reviews against open review requests — this is how a
 * review gets credited, never via self-report.
 */
export async function markReviewedByMatch(
  repoFullName: string,
  number: number,
  reviewerUserId: string,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  const db = getDb();
  const matches = await db
    .select({
      id: prReviewRequests.id,
      submittedByUserId: prReviewRequests.submittedByUserId,
      title: prReviewRequests.title,
      prUrl: prReviewRequests.prUrl,
    })
    .from(prReviewRequests)
    .where(
      and(
        eq(prReviewRequests.repoFullName, repoFullName),
        eq(prReviewRequests.number, number),
        eq(prReviewRequests.status, "needs_review"),
      ),
    );

  for (const match of matches) {
    // A reviewer reviewing their own submitted request would be nonsensical
    // (they'd also be excluded from ever seeing it in the queue), but guard
    // against it defensively rather than assume the queue filter is the only path here.
    if (match.submittedByUserId === reviewerUserId) {
      continue;
    }

    await db
      .update(prReviewRequests)
      .set({
        status: "reviewed",
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date().toISOString(),
      })
      .where(eq(prReviewRequests.id, match.id));

    await awardXp({
      userId: reviewerUserId,
      sourceType: "pr_review_completed",
      sourceKey: prReviewXpKey(match.id),
      metadata: { repoFullName, number },
    });

    // Auto-discovered/admin-curated entries have no real submitter to
    // notify — only a peer who actually asked for this gets pinged.
    if (match.submittedByUserId) {
      notifyPrReviewCompletedAsync({
        submitterUserId: match.submittedByUserId,
        repoFullName,
        prNumber: number,
        prTitle: match.title,
        prUrl: match.prUrl,
      });
    }
  }
}

/** Whether a non-hidden row already exists for this PR — used by the
 *  ecosystem discovery job to avoid re-adding a PR it already found (or one
 *  a peer/admin already added) on a prior run. */
export async function existsOpenRequestFor(
  repoFullName: string,
  number: number,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }

  const db = getDb();
  const rows = await db
    .select({ id: prReviewRequests.id })
    .from(prReviewRequests)
    .where(
      and(
        eq(prReviewRequests.repoFullName, repoFullName),
        eq(prReviewRequests.number, number),
        ne(prReviewRequests.status, "hidden"),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Inserts a review request the ecosystem-discovery job found via GitHub
 * search — unlike `createReviewRequest`, there's no submitting user and the
 * PR data already came back from the search result itself, so this skips
 * the per-user-token `fetchPullRequestByUrl` call entirely.
 */
export async function insertDiscoveredReviewRequest(input: {
  prUrl: string;
  repoFullName: string;
  number: number;
  title: string;
  authorLogin: string;
  prCreatedAt: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(prReviewRequests).values({
    prUrl: input.prUrl,
    repoFullName: input.repoFullName,
    number: input.number,
    title: input.title,
    authorLogin: input.authorLogin,
    prCreatedAt: input.prCreatedAt,
    sourceType: "admin_curated",
    submittedByUserId: null,
    flaggedForReview: false,
  });
}

/**
 * Re-checks open requests against GitHub and closes out ones that have been
 * merged/closed since they were listed, so the queue doesn't accumulate PRs
 * that no longer need (or can't receive) a review. Budget-limited the same
 * way lib/github/sync.ts budgets its own enrichment calls.
 */
export async function refreshStaleRequests(input: {
  client: GithubClient;
  budget: number;
}): Promise<{ checked: number; closed: number }> {
  if (!isDatabaseConfigured()) {
    return { checked: 0, closed: 0 };
  }

  const db = getDb();
  const rows = await db
    .select({
      id: prReviewRequests.id,
      repoFullName: prReviewRequests.repoFullName,
      number: prReviewRequests.number,
    })
    .from(prReviewRequests)
    .where(eq(prReviewRequests.status, "needs_review"))
    .orderBy(asc(prReviewRequests.createdAt))
    .limit(input.budget);

  let closed = 0;
  for (const row of rows) {
    const [owner, repo] = row.repoFullName.split("/");
    try {
      const pr = await fetchPullRequestByUrl(input.client, owner, repo, row.number);
      if (pr.state !== "open") {
        await db
          .update(prReviewRequests)
          .set({ status: "closed" })
          .where(eq(prReviewRequests.id, row.id));
        closed += 1;
      }
    } catch {
      // Leave it as-is if GitHub is unreachable or the PR/repo is gone
      // (e.g. deleted) — not confident enough to auto-close on a fetch error.
    }
  }

  return { checked: rows.length, closed };
}
