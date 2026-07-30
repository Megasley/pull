import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Periodic admin overview aggregates (funnel, MAU, drop-off, role counts).
 * Single-row upsert keyed by `id` — read path stays cheap; cron refreshes payload.
 */
export const adminMetricsSnapshots = pgTable("admin_metrics_snapshots", {
  id: text("id").primaryKey().default("overview"),
  computedAt: timestamp("computed_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  error: text("error"),
});
