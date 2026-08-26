import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { difficultyEnum } from "./enums";
import { organizations } from "./roadmaps";
import { users } from "./users";

// ─── Org-level shared invite link ─────────────────────────────────────────
// One active link per org. Tokens are prefixed with "o_" to distinguish from
// per-participant tokens at the URL level.

export const orgInviteLinks = pgTable(
  "org_invite_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    seatCap: integer("seat_cap"),
    seatCount: integer("seat_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    status: text("status", { enum: ["active", "revoked"] }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("org_invite_links_token_hash_idx").on(table.tokenHash),
    index("org_invite_links_organization_id_idx").on(table.organizationId),
    index("org_invite_links_status_idx").on(table.status),
  ],
);

export const orgMemberships = pgTable(
  "org_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteLinkId: uuid("invite_link_id").references(() => orgInviteLinks.id, {
      onDelete: "set null",
    }),
    /** First time this member clicked into a suggested/curated opportunity from their hub. */
    exploredOpportunityAt: timestamp("explored_opportunity_at", {
      withTimezone: true,
      mode: "string",
    }),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("org_memberships_org_user_idx").on(table.organizationId, table.userId),
    index("org_memberships_organization_id_idx").on(table.organizationId),
    index("org_memberships_user_id_idx").on(table.userId),
  ],
);

// Skills are stored as plain text per org — consistent with the existing
// users.skills jsonb[] pattern but normalised here for admin manageability.
export const orgSkills = pgTable(
  "org_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    skill: text("skill").notNull(),
  },
  (table) => [
    uniqueIndex("org_skills_organization_skill_idx").on(table.organizationId, table.skill),
    index("org_skills_organization_id_idx").on(table.organizationId),
  ],
);

// Manually curated contribution opportunities assigned to an organization.
// Simple rules-based matching via skill overlap — no AI required for V1.
export const orgOpportunities = pgTable(
  "org_opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    difficulty: difficultyEnum("difficulty").notNull().default("beginner"),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    contributionType: text("contribution_type"),
    repositoryUrl: text("repository_url"),
    issueUrl: text("issue_url"),
    whyRecommended: text("why_recommended"),
    isPinned: boolean("is_pinned").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("org_opportunities_organization_id_idx").on(table.organizationId),
    index("org_opportunities_difficulty_idx").on(table.difficulty),
  ],
);
