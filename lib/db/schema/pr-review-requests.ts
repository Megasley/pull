import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { prReviewSourceTypeEnum, prReviewStatusEnum } from "./enums";
import { users } from "./users";

/**
 * A real GitHub PR listed for peer review — the "PR review discovery
 * dashboard" (issue: builder suggestion to surface PRs needing review).
 * Pull never hosts the review itself; this table is purely a discovery
 * queue. `status` moves to "reviewed" via the credit-detection hook in
 * lib/github/sync.ts (cross-referencing a builder's own GitHub review sync
 * against open rows here), or via the "I reviewed this" self-report button
 * (lib/pr-reviews/repository.ts:reportOwnReview) — both re-verify against
 * GitHub and funnel through the same markReviewedByMatch, so credit is
 * always earned, never just claimed.
 */
export const prReviewRequests = pgTable(
  "pr_review_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    prUrl: text("pr_url").notNull(),
    repoFullName: text("repo_full_name").notNull(),
    number: integer("number").notNull(),

    title: text("title").notNull(),
    authorLogin: text("author_login").notNull(),
    /** When the PR was actually opened on GitHub — not when Pull found or
     *  was told about it. Nullable because rows inserted before this column
     *  existed have no way to backfill it retroactively; the suggestion-age
     *  filter falls back to `createdAt` for those. */
    prCreatedAt: timestamp("pr_created_at", { withTimezone: true, mode: "string" }),

    /** Diff size, for the "how big a bite is this" signal on the card.
     *  Only available for PRs fetched via the single-PR detail endpoint
     *  (peer submissions, admin single-URL adds) — the ecosystem-discovery
     *  job uses GitHub's lighter search API, which doesn't return diff
     *  stats, so these stay null for auto-discovered rows. */
    additions: integer("additions"),
    deletions: integer("deletions"),
    filesChanged: integer("files_changed"),

    sourceType: prReviewSourceTypeEnum("source_type").notNull(),
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    status: prReviewStatusEnum("status").notNull().default("needs_review"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),

    flaggedForReview: boolean("flagged_for_review").notNull().default(false),
    hiddenAt: timestamp("hidden_at", { withTimezone: true, mode: "string" }),
    hiddenReason: text("hidden_reason"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pr_review_requests_status_idx").on(table.status),
    index("pr_review_requests_source_type_idx").on(table.sourceType),
    index("pr_review_requests_submitted_by_idx").on(table.submittedByUserId),
    index("pr_review_requests_repo_number_idx").on(table.repoFullName, table.number),
    index("pr_review_requests_flagged_idx").on(table.flaggedForReview),
  ],
);
