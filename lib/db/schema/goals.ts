import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { weeklyGoalTargetTypeEnum } from "./enums";
import { users } from "./users";

export const userWeeklyGoals = pgTable(
  "user_weekly_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: text("week_start").notNull(),
    title: text("title").notNull(),
    targetType: weeklyGoalTargetTypeEnum("target_type").notNull(),
    targetCount: integer("target_count").notNull().default(1),
    progressCount: integer("progress_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_weekly_goals_user_week_title_idx").on(
      table.userId,
      table.weekStart,
      table.title,
    ),
    index("user_weekly_goals_user_id_idx").on(table.userId),
    index("user_weekly_goals_week_start_idx").on(table.weekStart),
  ],
);
