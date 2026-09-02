import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { milestoneTypeEnum } from "./enums";
import { projects } from "./roadmaps";
import { users } from "./users";

/**
 * One row per (user, milestone_type) — the durable, admin-facing record of
 * a builder reaching a first-time contribution milestone. Distinct from
 * `achievements`/`user_achievements`: those are the user-facing gamified
 * layer (title, XP, badge); this is the operational layer admins watch,
 * carrying the repo/PR context an achievement row doesn't. Where a
 * milestone has a matching achievement, both get created — see
 * lib/milestones/service.ts.
 */
export const milestoneEvents = pgTable(
  "milestone_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    milestoneType: milestoneTypeEnum("milestone_type").notNull(),
    repository: text("repository"),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    pullRequestUrl: text("pull_request_url"),
    pullRequestNumber: integer("pull_request_number"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    achievedAt: timestamp("achieved_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // The idempotency guarantee: a repeated GitHub sync (or a race between
    // two concurrent syncs) can never insert the same milestone twice —
    // callers use onConflictDoNothing against this exact target.
    uniqueIndex("milestone_events_user_milestone_idx").on(table.userId, table.milestoneType),
    index("milestone_events_achieved_at_idx").on(table.achievedAt),
    index("milestone_events_milestone_type_idx").on(table.milestoneType),
  ],
);

/**
 * Admin-facing notification inbox. Always tied 1:1 to the milestone_event
 * that created it. Read purely through the direct Postgres connection from
 * admin routes/actions (gated by requireAdmin()) — no RLS, matching
 * admin_metrics_snapshots: this data is never reached via PostgREST with a
 * user JWT, so RLS would add ceremony without adding safety.
 */
export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    milestoneEventId: uuid("milestone_event_id")
      .notNull()
      .references(() => milestoneEvents.id, { onDelete: "cascade" }),
    subjectUserId: uuid("subject_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_notifications_created_at_idx").on(table.createdAt),
    index("admin_notifications_unread_idx").on(table.readAt),
    index("admin_notifications_subject_user_id_idx").on(table.subjectUserId),
  ],
);
