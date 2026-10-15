import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { RoadmapDifficulty } from "@/types";
import type { DiscoveryTrack } from "@/types/discovery";
import type { IssueCategory } from "@/types/issues";

import { users } from "./users";

/** pending → approved (live in recommendations) | rejected. An approved
 *  issue moves to closed once GitHub reports it closed/deleted, which drops
 *  it from recommendations. */
export const submittedIssueStatusEnum = pgEnum("submitted_issue_status", [
  "pending",
  "approved",
  "rejected",
  "closed",
]);

/**
 * A GitHub issue a signed-in builder suggested for the /issues
 * recommendations. Metadata is pulled from GitHub at submit time (never
 * typed in), and the classification fields are pre-filled from the issue's
 * labels (lib/issues/classify.ts) for an admin to confirm or adjust on
 * approval. Approved rows are merged with content/discovery/issues.json by
 * lib/issues/submissions.ts.
 */
export const submittedIssues = pgTable(
  "submitted_issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    issueUrl: text("issue_url").notNull(),
    repoFullName: text("repo_full_name").notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    labels: jsonb("labels").$type<string[]>().notNull().default([]),
    language: text("language"),

    category: text("category").$type<IssueCategory>().notNull(),
    difficulty: text("difficulty").$type<RoadmapDifficulty>().notNull(),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    tracks: jsonb("tracks").$type<DiscoveryTrack[]>().notNull().default([]),
    estimatedHours: integer("estimated_hours").notNull(),
    summary: text("summary").notNull(),

    status: submittedIssueStatusEnum("status").notNull().default("pending"),
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    moderatedByUserId: uuid("moderated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true, mode: "string" }),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("submitted_issues_repo_number_idx").on(table.repoFullName, table.number),
    index("submitted_issues_status_idx").on(table.status),
    index("submitted_issues_submitted_by_idx").on(table.submittedByUserId),
  ],
);
