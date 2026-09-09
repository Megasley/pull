import { and, asc, count, desc, eq, inArray, lte, sql } from "drizzle-orm";

import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  githubCommits,
  githubConnections,
  githubContributionDays,
  githubIssues,
  githubPullRequestEvents,
  githubPullRequests,
  githubRepositories,
  githubReviewedPullRequests,
} from "@/lib/db/schema";
import type {
  GithubCommitRecord,
  GithubConnectionPublic,
  GithubContributionDay,
  GithubIssueRecord,
  GithubPullRequestRecord,
  GithubRepositoryRecord,
  GithubReviewedPullRequestRecord,
  GithubSyncStatus,
} from "@/types/github";

function nowIso() {
  return new Date().toISOString();
}

function mapConnectionPublic(
  row: typeof githubConnections.$inferSelect,
): GithubConnectionPublic {
  return {
    connected: true,
    login: row.login,
    avatarUrl: row.avatarUrl,
    profileUrl: row.profileUrl,
    name: row.name,
    bio: row.bio,
    publicRepos: row.publicRepos,
    followers: row.followers,
    following: row.following,
    totalStars: row.totalStars,
    syncStatus: row.syncStatus,
    syncError: row.syncError,
    lastSyncedAt: row.lastSyncedAt,
    nextSyncAt: row.nextSyncAt,
  };
}

function mapRepo(row: typeof githubRepositories.$inferSelect): GithubRepositoryRecord {
  return {
    id: row.id,
    githubId: row.githubId,
    name: row.name,
    fullName: row.fullName,
    description: row.description,
    htmlUrl: row.htmlUrl,
    language: row.language,
    stargazersCount: row.stargazersCount,
    forksCount: row.forksCount,
    openIssuesCount: row.openIssuesCount,
    licenseSpdx: row.licenseSpdx,
    topics: row.topics ?? [],
    isFork: row.isFork,
    isPrivate: row.isPrivate,
    isPinned: row.isPinned,
    defaultBranch: row.defaultBranch,
    pushedAt: row.pushedAt,
    githubUpdatedAt: row.githubUpdatedAt,
  };
}

export async function getGithubConnection(userId: string) {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(githubConnections)
    .where(eq(githubConnections.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGithubConnectionPublic(
  userId: string,
): Promise<GithubConnectionPublic | null> {
  const row = await getGithubConnection(userId);
  return row ? mapConnectionPublic(row) : null;
}

export async function upsertGithubConnection(input: {
  userId: string;
  githubUserId: number;
  login: string;
  accessToken: string;
  scopes?: string;
  avatarUrl?: string | null;
  profileUrl?: string | null;
  name?: string | null;
  bio?: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
  totalStars?: number;
  syncStatus?: GithubSyncStatus;
  syncError?: string | null;
  lastSyncedAt?: string | null;
  nextSyncAt?: string | null;
}) {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  const stamp = nowIso();

  const [row] = await db
    .insert(githubConnections)
    .values({
      userId: input.userId,
      githubUserId: input.githubUserId,
      login: input.login,
      accessToken: input.accessToken,
      scopes: input.scopes ?? "",
      avatarUrl: input.avatarUrl ?? null,
      profileUrl: input.profileUrl ?? null,
      name: input.name ?? null,
      bio: input.bio ?? "",
      publicRepos: input.publicRepos ?? 0,
      followers: input.followers ?? 0,
      following: input.following ?? 0,
      totalStars: input.totalStars ?? 0,
      syncStatus: input.syncStatus ?? "idle",
      syncError: input.syncError ?? null,
      lastSyncedAt: input.lastSyncedAt ?? null,
      nextSyncAt: input.nextSyncAt ?? null,
      createdAt: stamp,
      updatedAt: stamp,
    })
    .onConflictDoUpdate({
      target: githubConnections.userId,
      set: {
        githubUserId: input.githubUserId,
        login: input.login,
        accessToken: input.accessToken,
        scopes: input.scopes ?? "",
        avatarUrl: input.avatarUrl ?? null,
        profileUrl: input.profileUrl ?? null,
        name: input.name ?? null,
        bio: input.bio ?? "",
        publicRepos: input.publicRepos ?? 0,
        followers: input.followers ?? 0,
        following: input.following ?? 0,
        totalStars: input.totalStars ?? 0,
        syncStatus: input.syncStatus ?? "idle",
        syncError: input.syncError ?? null,
        lastSyncedAt: input.lastSyncedAt ?? null,
        nextSyncAt: input.nextSyncAt ?? null,
        updatedAt: stamp,
      },
    })
    .returning();

  return row ?? null;
}

export async function updateGithubConnectionToken(userId: string, accessToken: string) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  await db
    .update(githubConnections)
    .set({ accessToken, updatedAt: nowIso() })
    .where(eq(githubConnections.userId, userId));
}

export async function setGithubSyncStatus(
  userId: string,
  status: GithubSyncStatus,
  error?: string | null,
) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  await db
    .update(githubConnections)
    .set({
      syncStatus: status,
      syncError: error ?? null,
      updatedAt: nowIso(),
    })
    .where(eq(githubConnections.userId, userId));
}

export async function markGithubSyncSuccess(
  userId: string,
  stats: {
    publicRepos: number;
    followers: number;
    following: number;
    totalStars: number;
    nextSyncAt: string;
  },
) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  const stamp = nowIso();
  await db
    .update(githubConnections)
    .set({
      syncStatus: "success",
      syncError: null,
      lastSyncedAt: stamp,
      nextSyncAt: stats.nextSyncAt,
      publicRepos: stats.publicRepos,
      followers: stats.followers,
      following: stats.following,
      totalStars: stats.totalStars,
      updatedAt: stamp,
    })
    .where(eq(githubConnections.userId, userId));
}

export async function replaceGithubRepositories(
  userId: string,
  repos: Array<{
    githubId: number;
    name: string;
    fullName: string;
    description: string | null;
    htmlUrl: string;
    language: string | null;
    stargazersCount: number;
    forksCount: number;
    openIssuesCount: number;
    licenseSpdx: string | null;
    topics: string[];
    isFork: boolean;
    isPrivate: boolean;
    isPinned: boolean;
    defaultBranch: string | null;
    pushedAt: string | null;
    githubCreatedAt: string | null;
    githubUpdatedAt: string | null;
  }>,
) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  const stamp = nowIso();

  await db.delete(githubRepositories).where(eq(githubRepositories.userId, userId));

  if (repos.length === 0) return;

  // Chunk inserts for users with many repos.
  const chunkSize = 100;
  for (let i = 0; i < repos.length; i += chunkSize) {
    const chunk = repos.slice(i, i + chunkSize);
    await db.insert(githubRepositories).values(
      chunk.map((repo) => ({
        userId,
        ...repo,
        syncedAt: stamp,
      })),
    );
  }
}

export type ExistingPullRequestForSync = {
  id: string;
  githubId: number;
  state: string;
  merged: boolean;
  draft: boolean;
  filesChanged: number;
  additions: number;
  deletions: number;
  reviewComments: number;
  githubMergedAt: string | null;
  githubClosedAt: string | null;
};

/** All of a user's currently-stored PRs, keyed by githubId, for sync-time diffing. */
export async function getExistingPullRequestsForSync(
  userId: string,
): Promise<Map<number, ExistingPullRequestForSync>> {
  const map = new Map<number, ExistingPullRequestForSync>();
  if (!isDatabaseConfigured()) return map;
  const db = getDb();
  const rows = await db
    .select({
      id: githubPullRequests.id,
      githubId: githubPullRequests.githubId,
      state: githubPullRequests.state,
      merged: githubPullRequests.merged,
      draft: githubPullRequests.draft,
      filesChanged: githubPullRequests.filesChanged,
      additions: githubPullRequests.additions,
      deletions: githubPullRequests.deletions,
      reviewComments: githubPullRequests.reviewComments,
      githubMergedAt: githubPullRequests.githubMergedAt,
      githubClosedAt: githubPullRequests.githubClosedAt,
    })
    .from(githubPullRequests)
    .where(eq(githubPullRequests.userId, userId));
  for (const row of rows) {
    map.set(row.githubId, row);
  }
  return map;
}

/** PRs whose terminal state (merged or closed) can't change — safe to skip
 *  re-enrichment for. See lib/github/api.ts:fetchAuthoredPullRequests. */
export function getResolvedGithubIds(
  existing: Map<number, ExistingPullRequestForSync>,
): Set<number> {
  const resolved = new Set<number>();
  for (const row of existing.values()) {
    if (row.merged || row.state === "closed") {
      resolved.add(row.githubId);
    }
  }
  return resolved;
}

export type PullRequestSyncInput = {
  githubId: number;
  number: number;
  title: string;
  state: string;
  merged: boolean;
  draft: boolean;
  /** False when draft/filesChanged/additions/deletions/reviewComments came
   *  from the search API default rather than a verified per-PR detail call —
   *  see lib/github/api.ts:fetchAuthoredPullRequests. */
  enriched: boolean;
  repoFullName: string;
  htmlUrl: string;
  githubCreatedAt: string | null;
  githubClosedAt: string | null;
  githubMergedAt: string | null;
  labels?: string[];
  language?: string | null;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  reviewComments?: number;
  contributionType?: string;
  isOwnRepo: boolean;
  /** True when repoFullName is Pull's First Contribution practice repo —
   *  see lib/first-contribution/practice-repo.ts. */
  isPracticeRepo: boolean;
  /** Only applied when inserting a brand-new row — never overwrites existing
   *  attribution on an update. See lib/github/attribution.ts. */
  attributedPartnerId: string | null;
  attributedOpportunityEventId: string | null;
};

/**
 * Idempotent upsert by (userId, githubId) — replaces the old delete+reinsert
 * pattern so a PR that ages out of the fetch window is simply left untouched
 * rather than deleted, preserving durable history. Returns the row ids and
 * before/after state needed to emit lifecycle events.
 */
export async function upsertGithubPullRequests(
  userId: string,
  items: PullRequestSyncInput[],
  existing: Map<number, ExistingPullRequestForSync>,
): Promise<
  Array<{
    input: PullRequestSyncInput;
    pullRequestId: string;
    previous: ExistingPullRequestForSync | null;
  }>
> {
  if (!isDatabaseConfigured() || items.length === 0) return [];
  const db = getDb();
  const stamp = nowIso();
  const results: Array<{
    input: PullRequestSyncInput;
    pullRequestId: string;
    previous: ExistingPullRequestForSync | null;
  }> = [];

  for (const item of items) {
    const previous = existing.get(item.githubId) ?? null;

    // Enrichment was skipped this sync (already-resolved or over budget) —
    // keep the last verified values for the fields enrichment controls,
    // rather than overwrite with search-API placeholders.
    const draft = item.enriched ? item.draft : (previous?.draft ?? item.draft);
    const filesChanged = item.enriched
      ? (item.filesChanged ?? 0)
      : (previous?.filesChanged ?? item.filesChanged ?? 0);
    const additions = item.enriched
      ? (item.additions ?? 0)
      : (previous?.additions ?? item.additions ?? 0);
    const deletions = item.enriched
      ? (item.deletions ?? 0)
      : (previous?.deletions ?? item.deletions ?? 0);
    const reviewComments = item.enriched
      ? (item.reviewComments ?? 0)
      : (previous?.reviewComments ?? item.reviewComments ?? 0);

    const [row] = await db
      .insert(githubPullRequests)
      .values({
        userId,
        githubId: item.githubId,
        number: item.number,
        title: item.title,
        state: item.state,
        merged: item.merged,
        draft,
        repoFullName: item.repoFullName,
        htmlUrl: item.htmlUrl,
        githubCreatedAt: item.githubCreatedAt,
        githubClosedAt: item.githubClosedAt,
        githubMergedAt: item.githubMergedAt,
        labels: item.labels ?? [],
        language: item.language ?? null,
        filesChanged,
        additions,
        deletions,
        reviewComments,
        contributionType: item.contributionType ?? "other",
        isOwnRepo: item.isOwnRepo,
        isPracticeRepo: item.isPracticeRepo,
        // Only reached when there's no existing row (no unique-key
        // conflict) — attribution is always fresh for a genuine first insert.
        attributedPartnerId: item.attributedPartnerId,
        attributedOpportunityEventId: item.attributedOpportunityEventId,
        firstSyncedAt: stamp,
        syncedAt: stamp,
      })
      .onConflictDoUpdate({
        target: [githubPullRequests.userId, githubPullRequests.githubId],
        set: {
          title: item.title,
          state: item.state,
          merged: item.merged,
          draft,
          repoFullName: item.repoFullName,
          htmlUrl: item.htmlUrl,
          githubClosedAt: item.githubClosedAt,
          githubMergedAt: item.githubMergedAt,
          labels: item.labels ?? [],
          language: item.language ?? null,
          filesChanged,
          additions,
          deletions,
          reviewComments,
          contributionType: item.contributionType ?? "other",
          isOwnRepo: item.isOwnRepo,
          isPracticeRepo: item.isPracticeRepo,
          // attributedPartnerId / attributedOpportunityEventId / firstSyncedAt
          // intentionally omitted — set once at insert, never overwritten.
          syncedAt: stamp,
        },
      })
      .returning({ id: githubPullRequests.id });

    if (row) {
      results.push({ input: item, pullRequestId: row.id, previous });
    }
  }

  return results;
}

export type PullRequestLifecycleEventInput = {
  pullRequestId: string;
  userId: string;
  eventType: "opened" | "ready_for_review" | "merged" | "closed";
  occurredAt: string;
  timestampSource: "github" | "sync_observed";
};

/**
 * Idempotent by construction — unique(pullRequestId, eventType) plus
 * onConflictDoNothing means re-running sync (retry, duplicate cron
 * invocation) can never duplicate a lifecycle event.
 */
export async function recordPullRequestEvents(
  events: PullRequestLifecycleEventInput[],
): Promise<void> {
  if (!isDatabaseConfigured() || events.length === 0) return;
  const db = getDb();
  await db
    .insert(githubPullRequestEvents)
    .values(
      events.map((event) => ({
        pullRequestId: event.pullRequestId,
        userId: event.userId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        timestampSource: event.timestampSource,
      })),
    )
    .onConflictDoNothing({
      target: [
        githubPullRequestEvents.pullRequestId,
        githubPullRequestEvents.eventType,
      ],
    });
}

/**
 * Diffs upsert results against their prior state and returns the lifecycle
 * events that should be recorded. Pure function — no I/O — so it's directly
 * unit-testable. See tests/impact.test.ts.
 */
export function deriveLifecycleEvents(
  results: Array<{
    input: PullRequestSyncInput;
    pullRequestId: string;
    previous: ExistingPullRequestForSync | null;
  }>,
  userId: string,
): PullRequestLifecycleEventInput[] {
  const events: PullRequestLifecycleEventInput[] = [];

  for (const { input, pullRequestId, previous } of results) {
    if (!previous) {
      // Brand new PR. We only know the state as of discovery — record
      // "opened" using GitHub's real timestamp, and any terminal state
      // that's already true, but never invent a ready_for_review transition
      // we didn't actually observe happening.
      if (input.githubCreatedAt) {
        events.push({
          pullRequestId,
          userId,
          eventType: "opened",
          occurredAt: input.githubCreatedAt,
          timestampSource: "github",
        });
      }
      if (input.merged && input.githubMergedAt) {
        events.push({
          pullRequestId,
          userId,
          eventType: "merged",
          occurredAt: input.githubMergedAt,
          timestampSource: "github",
        });
      } else if (input.state === "closed" && input.githubClosedAt) {
        events.push({
          pullRequestId,
          userId,
          eventType: "closed",
          occurredAt: input.githubClosedAt,
          timestampSource: "github",
        });
      }
      continue;
    }

    if (!previous.merged && input.merged && input.githubMergedAt) {
      events.push({
        pullRequestId,
        userId,
        eventType: "merged",
        occurredAt: input.githubMergedAt,
        timestampSource: "github",
      });
    } else if (
      previous.state !== "closed" &&
      input.state === "closed" &&
      !input.merged &&
      input.githubClosedAt
    ) {
      events.push({
        pullRequestId,
        userId,
        eventType: "closed",
        occurredAt: input.githubClosedAt,
        timestampSource: "github",
      });
    }

    // Only trust a draft->ready transition when this sync actually
    // re-verified draft status (enriched) — otherwise a resolved/
    // budget-skipped PR's carried-forward `draft` value could look like a
    // transition when nothing was actually observed.
    if (previous.draft && input.enriched && !input.draft) {
      events.push({
        pullRequestId,
        userId,
        eventType: "ready_for_review",
        occurredAt: new Date().toISOString(),
        timestampSource: "sync_observed",
      });
    }
  }

  return events;
}

export async function replaceGithubIssues(
  userId: string,
  items: Array<{
    githubId: number;
    number: number;
    title: string;
    state: string;
    repoFullName: string;
    htmlUrl: string;
    githubCreatedAt: string | null;
    githubClosedAt: string | null;
    relation?: string;
  }>,
) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  const stamp = nowIso();
  await db.delete(githubIssues).where(eq(githubIssues.userId, userId));
  if (items.length === 0) return;
  await db.insert(githubIssues).values(
    items.map((item) => ({
      userId,
      githubId: item.githubId,
      number: item.number,
      title: item.title,
      state: item.state,
      relation: item.relation ?? "authored",
      repoFullName: item.repoFullName,
      htmlUrl: item.htmlUrl,
      githubCreatedAt: item.githubCreatedAt,
      githubClosedAt: item.githubClosedAt,
      syncedAt: stamp,
    })),
  );
}

export async function replaceGithubReviewedPullRequests(
  userId: string,
  items: Array<{
    githubId: number;
    number: number;
    title: string;
    state: string;
    merged: boolean;
    repoFullName: string;
    htmlUrl: string;
    authorLogin: string | null;
    language: string | null;
    githubCreatedAt: string | null;
    githubUpdatedAt: string | null;
  }>,
) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  const stamp = nowIso();
  await db
    .delete(githubReviewedPullRequests)
    .where(eq(githubReviewedPullRequests.userId, userId));
  if (items.length === 0) return;
  await db.insert(githubReviewedPullRequests).values(
    items.map((item) => ({
      userId,
      ...item,
      syncedAt: stamp,
    })),
  );
}

export async function listGithubReviewedPullRequests(
  userId: string,
): Promise<GithubReviewedPullRequestRecord[]> {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(githubReviewedPullRequests)
    .where(eq(githubReviewedPullRequests.userId, userId))
    .orderBy(desc(githubReviewedPullRequests.githubUpdatedAt));

  return rows.map((row) => ({
    id: row.id,
    githubId: row.githubId,
    number: row.number,
    title: row.title,
    state: row.state,
    merged: row.merged,
    repoFullName: row.repoFullName,
    htmlUrl: row.htmlUrl,
    authorLogin: row.authorLogin,
    language: row.language,
    githubCreatedAt: row.githubCreatedAt,
    githubUpdatedAt: row.githubUpdatedAt,
  }));
}

export async function replaceGithubCommits(
  userId: string,
  items: Array<{
    sha: string;
    message: string;
    repoFullName: string;
    htmlUrl: string;
    committedAt: string | null;
  }>,
) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  const stamp = nowIso();
  await db.delete(githubCommits).where(eq(githubCommits.userId, userId));
  if (items.length === 0) return;
  await db
    .insert(githubCommits)
    .values(items.map((item) => ({ userId, ...item, syncedAt: stamp })));
}

export async function replaceGithubContributionDays(
  userId: string,
  days: Array<{ contributionDate: string; count: number; color: string | null }>,
) {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  const stamp = nowIso();
  await db
    .delete(githubContributionDays)
    .where(eq(githubContributionDays.userId, userId));
  if (days.length === 0) return;

  const chunkSize = 100;
  for (let i = 0; i < days.length; i += chunkSize) {
    const chunk = days.slice(i, i + chunkSize);
    await db
      .insert(githubContributionDays)
      .values(chunk.map((day) => ({ userId, ...day, syncedAt: stamp })));
  }
}

export async function listGithubRepositories(
  userId: string,
  options: { pinnedOnly?: boolean; limit?: number } = {},
): Promise<GithubRepositoryRecord[]> {
  if (!isDatabaseConfigured()) return [];
  return withDbRetry(async () => {
    const db = getDb();
    const query = db
      .select()
      .from(githubRepositories)
      .where(
        options.pinnedOnly
          ? and(
              eq(githubRepositories.userId, userId),
              eq(githubRepositories.isPinned, true),
            )
          : eq(githubRepositories.userId, userId),
      )
      .orderBy(
        desc(githubRepositories.isPinned),
        desc(githubRepositories.stargazersCount),
        desc(githubRepositories.pushedAt),
      );

    const rows =
      options.limit === undefined ? await query : await query.limit(options.limit);

    return rows.map(mapRepo);
  });
}

export async function listGithubContributionDays(
  userId: string,
): Promise<GithubContributionDay[]> {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(githubContributionDays)
    .where(eq(githubContributionDays.userId, userId))
    .orderBy(asc(githubContributionDays.contributionDate));

  return rows.map((row) => ({
    date: row.contributionDate,
    count: row.count,
    color: row.color,
  }));
}

function normalizePrListOptions(
  options?: number | { limit?: number; state?: string; merged?: boolean },
): { limit?: number; state?: string; merged?: boolean } {
  if (typeof options === "number") {
    return { limit: options };
  }
  return options ?? {};
}

export async function listGithubPullRequests(
  userId: string,
  options?: number | { limit?: number; state?: string; merged?: boolean },
): Promise<GithubPullRequestRecord[]> {
  if (!isDatabaseConfigured()) return [];
  const { limit, state, merged } = normalizePrListOptions(options);
  const db = getDb();

  const filters = [eq(githubPullRequests.userId, userId)];
  if (state) {
    filters.push(eq(githubPullRequests.state, state));
  }
  if (merged !== undefined) {
    filters.push(eq(githubPullRequests.merged, merged));
  }

  const query = db
    .select()
    .from(githubPullRequests)
    .where(and(...filters))
    .orderBy(
      desc(githubPullRequests.merged),
      desc(githubPullRequests.githubMergedAt),
      desc(githubPullRequests.githubCreatedAt),
    );

  const rows = limit === undefined ? await query : await query.limit(limit);

  return rows.map((row) => ({
    id: row.id,
    githubId: row.githubId,
    number: row.number,
    title: row.title,
    state: row.state,
    merged: row.merged,
    repoFullName: row.repoFullName,
    htmlUrl: row.htmlUrl,
    githubCreatedAt: row.githubCreatedAt,
    githubMergedAt: row.githubMergedAt,
    labels: row.labels ?? [],
    language: row.language,
    filesChanged: row.filesChanged,
    additions: row.additions,
    deletions: row.deletions,
    reviewComments: row.reviewComments,
    contributionType: row.contributionType,
  }));
}

export async function listGithubIssues(
  userId: string,
  options?: number | { limit?: number; state?: string; relation?: string },
): Promise<GithubIssueRecord[]> {
  if (!isDatabaseConfigured()) return [];
  const normalized = typeof options === "number" ? { limit: options } : (options ?? {});
  const limit = normalized.limit ?? 20;
  const db = getDb();

  const filters = [eq(githubIssues.userId, userId)];
  if (normalized.state) {
    filters.push(eq(githubIssues.state, normalized.state));
  }
  if (normalized.relation) {
    filters.push(eq(githubIssues.relation, normalized.relation));
  }

  const rows = await db
    .select()
    .from(githubIssues)
    .where(and(...filters))
    .orderBy(desc(githubIssues.githubCreatedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    githubId: row.githubId,
    number: row.number,
    title: row.title,
    state: row.state,
    repoFullName: row.repoFullName,
    htmlUrl: row.htmlUrl,
    githubCreatedAt: row.githubCreatedAt,
    relation: row.relation,
  }));
}

export async function listGithubCommits(
  userId: string,
  limit = 20,
): Promise<GithubCommitRecord[]> {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(githubCommits)
    .where(eq(githubCommits.userId, userId))
    .orderBy(desc(githubCommits.committedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    sha: row.sha,
    message: row.message,
    repoFullName: row.repoFullName,
    htmlUrl: row.htmlUrl,
    committedAt: row.committedAt,
  }));
}

export async function countGithubSyncedEntities(userId: string) {
  if (!isDatabaseConfigured()) {
    return { repositories: 0, pullRequests: 0, issues: 0, commits: 0 };
  }
  const db = getDb();
  const [repos, prs, issues, commits] = await Promise.all([
    db
      .select({ value: count() })
      .from(githubRepositories)
      .where(eq(githubRepositories.userId, userId)),
    db
      .select({ value: count() })
      .from(githubPullRequests)
      .where(
        and(
          eq(githubPullRequests.userId, userId),
          // Excludes the First Contribution practice repo — see
          // countMergedGithubPullRequests below for why.
          eq(githubPullRequests.isPracticeRepo, false),
        ),
      ),
    db
      .select({ value: count() })
      .from(githubIssues)
      .where(eq(githubIssues.userId, userId)),
    db
      .select({ value: count() })
      .from(githubCommits)
      .where(eq(githubCommits.userId, userId)),
  ]);

  return {
    repositories: Number(repos[0]?.value ?? 0),
    pullRequests: Number(prs[0]?.value ?? 0),
    issues: Number(issues[0]?.value ?? 0),
    commits: Number(commits[0]?.value ?? 0),
  };
}

/**
 * Total merged PRs synced for a user (not capped by list limits).
 *
 * Excludes the First Contribution practice repo — this count feeds the
 * "First Merged PR" achievement (lib/achievements/definitions.ts) and public
 * profile / partner-facing stats (lib/profile/load-public-profile.ts,
 * app/partners/[slug]/page.tsx), all of which represent real GitHub
 * contribution activity. A practice-repo merge must not unlock that
 * achievement or its email, or inflate those surfaces — same principle as
 * countVerifiedMergedPullRequests below and derivePrMilestoneCandidates in
 * lib/milestones/pr-signals.ts.
 */
export async function countMergedGithubPullRequests(userId: string): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(githubPullRequests)
    .where(
      and(
        eq(githubPullRequests.userId, userId),
        eq(githubPullRequests.merged, true),
        eq(githubPullRequests.isPracticeRepo, false),
      ),
    );
  return Number(row?.value ?? 0);
}

/**
 * Total non-draft (ready for review) PRs synced for a user — "submitted",
 * not just started.
 *
 * Excludes the First Contribution practice repo, for the same reason as
 * countMergedGithubPullRequests above — this feeds the "First Pull Request
 * Submitted" achievement, and a practice PR going ready-for-review must not
 * unlock it or its email.
 */
export async function countSubmittedGithubPullRequests(
  userId: string,
): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(githubPullRequests)
    .where(
      and(
        eq(githubPullRequests.userId, userId),
        eq(githubPullRequests.draft, false),
        eq(githubPullRequests.isPracticeRepo, false),
      ),
    );
  return Number(row?.value ?? 0);
}

/**
 * Merged PRs into a repo the user doesn't own and that isn't the First
 * Contribution practice repo — the "verified contribution" bar (matches
 * qualifyingConditions() in lib/impact/queries.ts): neither a merge to your
 * own repo nor a practice-repo merge is independent evidence of real open
 * source impact.
 */
export async function countVerifiedMergedPullRequests(userId: string): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(githubPullRequests)
    .where(
      and(
        eq(githubPullRequests.userId, userId),
        eq(githubPullRequests.merged, true),
        eq(githubPullRequests.isOwnRepo, false),
        eq(githubPullRequests.isPracticeRepo, false),
      ),
    );
  return Number(row?.value ?? 0);
}

/** Batch merged-PR counts for directory cards (same source as profile stats). */
export async function countMergedGithubPullRequestsByUserIds(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!isDatabaseConfigured() || userIds.length === 0) return counts;

  const db = getDb();
  const rows = await db
    .select({
      userId: githubPullRequests.userId,
      value: count(),
    })
    .from(githubPullRequests)
    .where(
      and(
        inArray(githubPullRequests.userId, userIds),
        eq(githubPullRequests.merged, true),
      ),
    )
    .groupBy(githubPullRequests.userId);

  for (const row of rows) {
    counts.set(row.userId, Number(row.value ?? 0));
  }
  return counts;
}

export async function listConnectionsDueForSync(limit = 20) {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const now = nowIso();
  return db
    .select({
      userId: githubConnections.userId,
      login: githubConnections.login,
      syncStatus: githubConnections.syncStatus,
    })
    .from(githubConnections)
    .where(
      and(
        sql`${githubConnections.syncStatus} <> 'syncing'`,
        lte(githubConnections.nextSyncAt, now),
      ),
    )
    .orderBy(asc(githubConnections.nextSyncAt))
    .limit(limit);
}
