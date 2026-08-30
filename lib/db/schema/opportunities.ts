import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { opportunityEventTypeEnum, opportunitySourceTypeEnum } from "./enums";
import { organizations } from "./roadmaps";
import { users } from "./users";

/**
 * Durable, first-party opportunity interaction log.
 *
 * There is no single DB-backed "opportunity" entity today — the general
 * discovery catalog lives in static content JSON, and only org-curated
 * opportunities (`org_opportunities`) have a real row. `opportunityKey` is a
 * stable synthetic identifier computed by lib/opportunities/keys.ts so both
 * kinds (and future ones) can be tracked without inventing a redundant
 * opportunity table. Append-only by design — see lib/opportunities/events.ts
 * for dedup rules ("viewed" is deduped per session window; "saved" and
 * "showed_interest" preserve every state change as its own row).
 */
export const opportunityEvents = pgTable(
  "opportunity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opportunityKey: text("opportunity_key").notNull(),
    sourceType: opportunitySourceTypeEnum("source_type").notNull(),
    eventType: opportunityEventTypeEnum("event_type").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    repoFullName: text("repo_full_name"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("opportunity_events_user_key_type_idx").on(
      table.userId,
      table.opportunityKey,
      table.eventType,
      table.createdAt,
    ),
    index("opportunity_events_key_type_idx").on(table.opportunityKey, table.eventType),
    index("opportunity_events_organization_id_idx").on(table.organizationId),
    index("opportunity_events_repo_full_name_idx").on(table.repoFullName),
    index("opportunity_events_created_at_idx").on(table.createdAt),
  ],
);
