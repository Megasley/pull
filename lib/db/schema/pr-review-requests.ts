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
 * queue. `status` moves to "reviewed" only via the credit-detection hook in
 * lib/github/sync.ts, which cross-references a builder's own GitHub review
 * sync data against open rows here — never via self-report.
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
