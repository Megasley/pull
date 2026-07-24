import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { EmailNotificationPrefs } from "@/types/notifications";
import { DEFAULT_EMAIL_NOTIFICATION_PREFS } from "@/types/notifications";

import { userRoleEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    avatar: text("avatar"),
    bio: text("bio").notNull().default(""),
    githubUsername: text("github_username").notNull(),
    email: text("email"),
    website: text("website"),
    twitterUrl: text("twitter_url"),
    linkedinUrl: text("linkedin_url"),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    emailNotifications: jsonb("email_notifications")
      .$type<EmailNotificationPrefs>()
      .notNull()
      .default(DEFAULT_EMAIL_NOTIFICATION_PREFS),
    role: userRoleEnum("role").notNull().default("builder"),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_github_username_idx").on(table.githubUsername),
    index("users_role_idx").on(table.role),
    index("users_last_active_at_idx").on(table.lastActiveAt),
  ],
);
