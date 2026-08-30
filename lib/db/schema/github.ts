import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  eventTimestampSourceEnum,
  githubSyncStatusEnum,
  prLifecycleEventTypeEnum,
} from "./enums";
import { organizations } from "./roadmaps";
import { users } from "./users";
import { opportunityEvents } from "./opportunities";

export const githubConnections = pgTable(
  "github_connections",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    githubUserId: bigint("github_user_id", { mode: "number" }).notNull(),
    login: text("login").notNull(),
    /** Server-only OAuth token. Never send to the client. */
    accessToken: text("access_token").notNull(),
    scopes: text("scopes").notNull().default(""),
    avatarUrl: text("avatar_url"),
    profileUrl: text("profile_url"),
    name: text("name"),
    bio: text("bio").notNull().default(""),
    publicRepos: integer("public_repos").notNull().default(0),
    followers: integer("followers").notNull().default(0),
    following: integer("following").notNull().default(0),
    totalStars: integer("total_stars").notNull().default(0),
    syncStatus: githubSyncStatusEnum("sync_status").notNull().default("idle"),
    syncError: text("sync_error"),
    lastSyncedAt: timestamp("last_synced_at", {
      withTimezone: true,
      mode: "string",
    }),
    nextSyncAt: timestamp("next_sync_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("github_connections_login_idx").on(table.login),
    index("github_connections_sync_status_idx").on(table.syncStatus),
    index("github_connections_next_sync_at_idx").on(table.nextSyncAt),
  ],
);

export const githubRepositories = pgTable(
  "github_repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubId: bigint("github_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description"),
    htmlUrl: text("html_url").notNull(),
    language: text("language"),
    stargazersCount: integer("stargazers_count").notNull().default(0),
    forksCount: integer("forks_count").notNull().default(0),
    openIssuesCount: integer("open_issues_count").notNull().default(0),
    licenseSpdx: text("license_spdx"),
    topics: jsonb("topics").$type<string[]>().notNull().default([]),
    isFork: boolean("is_fork").notNull().default(false),
    isPrivate: boolean("is_private").notNull().default(false),
    isPinned: boolean("is_pinned").notNull().default(false),
    defaultBranch: text("default_branch"),
    pushedAt: timestamp("pushed_at", { withTimezone: true, mode: "string" }),
    githubCreatedAt: timestamp("github_created_at", {
      withTimezone: true,
      mode: "string",
    }),
    githubUpdatedAt: timestamp("github_updated_at", {
      withTimezone: true,
      mode: "string",
    }),
    syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("github_repositories_user_github_id_idx").on(
      table.userId,
      table.githubId,
    ),
    index("github_repositories_user_id_idx").on(table.userId),
    index("github_repositories_language_idx").on(table.language),
    index("github_repositories_stargazers_idx").on(table.stargazersCount),
    index("github_repositories_pushed_at_idx").on(table.pushedAt),
  ],
);

export const githubPullRequests = pgTable(
  "github_pull_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubId: bigint("github_id", { mode: "number" }).notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    state: text("state").notNull(),
    merged: boolean("merged").notNull().default(false),
    draft: boolean("draft").notNull().default(false),
    repoFullName: text("repo_full_name").notNull(),
    htmlUrl: text("html_url").notNull(),
    githubCreatedAt: timestamp("github_created_at", {
      withTimezone: true,
      mode: "string",
    }),
    githubClosedAt: timestamp("github_closed_at", {
      withTimezone: true,
      mode: "string",
    }),
    githubMergedAt: timestamp("github_merged_at", {
      withTimezone: true,
      mode: "string",
    }),
    labels: jsonb("labels").$type<string[]>().notNull().default([]),
    language: text("language"),
    filesChanged: integer("files_changed").notNull().default(0),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    reviewComments: integer("review_comments").notNull().default(0),
    contributionType: text("contribution_type").notNull().default("other"),
    /** True when the PR's repo owner is the contributor's own GitHub login —
     *  used to exclude personal-project PRs from "qualifying contribution"
     *  definitions. See lib/impact/definitions.ts. */
    isOwnRepo: boolean("is_own_repo").notNull().default(false),
    /** Partner the user belonged to when this PR was opened (membership at
     *  time of contribution — see lib/impact/attribution.ts). Set once at
     *  first insert; never overwritten by later partner joins. */
    attributedPartnerId: uuid("attributed_partner_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    /** Opportunity click-through this PR is attributed to, if any (matched by
     *  repo within the configured attribution window). Set once; never
     *  overwritten by later opportunity interactions. */
    attributedOpportunityEventId: uuid("attributed_opportunity_event_id").references(
      () => opportunityEvents.id,
      { onDelete: "set null" },
    ),
    /** Immutable — set only when Pull's sync first observed this PR. Distinct
     *  from `syncedAt`, which updates on every sync. For rows that existed
     *  before this column shipped, backfilled to githubCreatedAt (the closest
     *  defensible proxy) — see scripts/backfill-contribution-history.ts. */
    firstSyncedAt: timestamp("first_synced_at", { withTimezone: true, mode: "string" }),
    syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("github_pull_requests_user_github_id_idx").on(
      table.userId,
      table.githubId,
    ),
    index("github_pull_requests_user_id_idx").on(table.userId),
    index("github_pull_requests_state_idx").on(table.state),
    index("github_pull_requests_merged_idx").on(table.merged),
    index("github_pull_requests_draft_idx").on(table.draft),
    index("github_pull_requests_contribution_type_idx").on(table.contributionType),
    index("github_pull_requests_repo_full_name_idx").on(table.repoFullName),
    index("github_pull_requests_attributed_partner_id_idx").on(table.attributedPartnerId),
    index("github_pull_requests_is_own_repo_idx").on(table.isOwnRepo),
  ],
);

/**
 * Durable, append-only PR lifecycle ledger. Emitted by lib/github/sync.ts
 * during reconciliation (state transitions detected against the previous
 * upsert) and by the one-time backfill script for pre-existing rows.
 * Idempotent by design: a PR can only record each event type once
 * (unique index below) so repeated syncs never duplicate history.
 */
export const githubPullRequestEvents = pgTable(
  "github_pull_request_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pullRequestId: uuid("pull_request_id")
      .notNull()
      .references(() => githubPullRequests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: prLifecycleEventTypeEnum("event_type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" }).notNull(),
    timestampSource: eventTimestampSourceEnum("timestamp_source").notNull().default("github"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("github_pull_request_events_pr_event_type_idx").on(
      table.pullRequestId,
      table.eventType,
    ),
    index("github_pull_request_events_user_id_idx").on(table.userId),
    index("github_pull_request_events_user_event_occurred_idx").on(
      table.userId,
      table.eventType,
      table.occurredAt,
    ),
    index("github_pull_request_events_occurred_at_idx").on(table.occurredAt),
  ],
);

export const githubIssues = pgTable(
  "github_issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubId: bigint("github_id", { mode: "number" }).notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    state: text("state").notNull(),
    /** authored = opened by user; assigned = assigned to user */
    relation: text("relation").notNull().default("authored"),
    repoFullName: text("repo_full_name").notNull(),
    htmlUrl: text("html_url").notNull(),
    githubCreatedAt: timestamp("github_created_at", {
      withTimezone: true,
      mode: "string",
    }),
    githubClosedAt: timestamp("github_closed_at", {
      withTimezone: true,
      mode: "string",
    }),
    syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("github_issues_user_github_id_idx").on(table.userId, table.githubId),
    index("github_issues_user_id_idx").on(table.userId),
    index("github_issues_state_idx").on(table.state),
    index("github_issues_relation_idx").on(table.relation),
  ],
);

export const githubCommits = pgTable(
  "github_commits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    message: text("message").notNull(),
    repoFullName: text("repo_full_name").notNull(),
    htmlUrl: text("html_url").notNull(),
    committedAt: timestamp("committed_at", {
      withTimezone: true,
      mode: "string",
    }),
    syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("github_commits_user_sha_repo_idx").on(
      table.userId,
      table.sha,
      table.repoFullName,
    ),
    index("github_commits_user_id_idx").on(table.userId),
    index("github_commits_committed_at_idx").on(table.committedAt),
  ],
);

export const githubContributionDays = pgTable(
  "github_contribution_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contributionDate: date("contribution_date", { mode: "string" }).notNull(),
    count: integer("count").notNull().default(0),
    color: text("color"),
    syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("github_contribution_days_user_date_idx").on(
      table.userId,
      table.contributionDate,
    ),
    index("github_contribution_days_user_id_idx").on(table.userId),
  ],
);
