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

import {
  chapterQuizStatusEnum,
  difficultyEnum,
  nodeStatusEnum,
  progressStatusEnum,
  resourceTypeEnum,
  reviewDecisionEnum,
  reviewEventTypeEnum,
  roadmapStatusEnum,
  submissionStatusEnum,
  xpSourceTypeEnum,
} from "./enums";
import { users } from "./users";

export const roadmaps = pgTable(
  "roadmaps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: roadmapStatusEnum("status").notNull().default("draft"),
    prerequisiteRoadmapId: uuid("prerequisite_roadmap_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("roadmaps_status_idx").on(table.status),
    index("roadmaps_prerequisite_roadmap_id_idx").on(table.prerequisiteRoadmapId),
  ],
);

export const roadmapSections = pgTable(
  "roadmap_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roadmapId: uuid("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    defaultExpanded: boolean("default_expanded").notNull().default(true),
    positionX: integer("position_x").notNull().default(0),
    positionY: integer("position_y").notNull().default(0),
    width: integer("width").notNull().default(340),
    height: integer("height").notNull().default(430),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("roadmap_sections_roadmap_slug_idx").on(table.roadmapId, table.slug),
    index("roadmap_sections_roadmap_id_idx").on(table.roadmapId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    roadmapId: uuid("roadmap_id").references(() => roadmaps.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    difficulty: difficultyEnum("difficulty").notNull().default("intermediate"),
    estimatedDuration: text("estimated_duration"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("projects_roadmap_id_idx").on(table.roadmapId)],
);

export const roadmapNodes = pgTable(
  "roadmap_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => roadmapSections.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    duration: text("duration"),
    difficulty: difficultyEnum("difficulty").notNull().default("beginner"),
    status: nodeStatusEnum("status").notNull().default("default"),
    sortOrder: integer("sort_order").notNull().default(0),
    positionX: integer("position_x").notNull().default(24),
    positionY: integer("position_y").notNull().default(88),
    lockedUntilSlugs: jsonb("locked_until_slugs")
      .$type<string[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("roadmap_nodes_section_slug_idx").on(table.sectionId, table.slug),
    index("roadmap_nodes_section_id_idx").on(table.sectionId),
    index("roadmap_nodes_project_id_idx").on(table.projectId),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => roadmapNodes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url"),
    type: resourceTypeEnum("type").notNull().default("other"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("resources_node_id_idx").on(table.nodeId),
    index("resources_type_idx").on(table.type),
  ],
);

export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => roadmapNodes.id, { onDelete: "cascade" }),
    status: progressStatusEnum("status").notNull().default("not_started"),
    completedAt: timestamp("completed_at", {
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
    uniqueIndex("user_progress_user_node_idx").on(table.userId, table.nodeId),
    index("user_progress_user_id_idx").on(table.userId),
    index("user_progress_node_id_idx").on(table.nodeId),
    index("user_progress_status_idx").on(table.status),
  ],
);

export const userRoadmapProgress = pgTable(
  "user_roadmap_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roadmapSlug: text("roadmap_slug").notNull(),
    nodeSlug: text("node_slug").notNull(),
    status: progressStatusEnum("status").notNull().default("completed"),
    completedAt: timestamp("completed_at", {
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
    uniqueIndex("user_roadmap_progress_user_roadmap_node_idx").on(
      table.userId,
      table.roadmapSlug,
      table.nodeSlug,
    ),
    index("user_roadmap_progress_user_id_idx").on(table.userId),
    index("user_roadmap_progress_roadmap_slug_idx").on(table.roadmapSlug),
    index("user_roadmap_progress_status_idx").on(table.status),
  ],
);

export const projectSubmissions = pgTable(
  "project_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: submissionStatusEnum("status").notNull().default("draft"),
    repoUrl: text("repo_url"),
    prUrl: text("pr_url"),
    liveDemoUrl: text("live_demo_url"),
    videoDemoUrl: text("video_demo_url"),
    screenshotUrls: jsonb("screenshot_urls").$type<string[]>().notNull().default([]),
    notes: text("notes").notNull().default(""),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
      mode: "string",
    }),
    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
      mode: "string",
    }),
    reviewRound: integer("review_round").notNull().default(1),
    claimedBy: uuid("claimed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    claimExpiresAt: timestamp("claim_expires_at", {
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
    index("project_submissions_user_id_idx").on(table.userId),
    index("project_submissions_project_id_idx").on(table.projectId),
    index("project_submissions_status_idx").on(table.status),
    index("project_submissions_claimed_by_idx").on(table.claimedBy),
  ],
);

export const submissionReviews = pgTable(
  "submission_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => projectSubmissions.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewRound: integer("review_round").notNull().default(1),
    decision: reviewDecisionEnum("decision").notNull(),
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("submission_reviews_submission_reviewer_round_idx").on(
      table.submissionId,
      table.reviewerId,
      table.reviewRound,
    ),
    index("submission_reviews_submission_id_idx").on(table.submissionId),
    index("submission_reviews_reviewer_id_idx").on(table.reviewerId),
  ],
);

export const submissionReviewEvents = pgTable(
  "submission_review_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => projectSubmissions.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: reviewEventTypeEnum("type").notNull(),
    fromStatus: submissionStatusEnum("from_status"),
    toStatus: submissionStatusEnum("to_status"),
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("submission_review_events_submission_id_idx").on(table.submissionId),
    index("submission_review_events_actor_user_id_idx").on(table.actorUserId),
    index("submission_review_events_created_at_idx").on(table.createdAt),
  ],
);

export const userChapterQuizzes = pgTable(
  "user_chapter_quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roadmapSlug: text("roadmap_slug").notNull(),
    quizId: text("quiz_id").notNull(),
    status: chapterQuizStatusEnum("status").notNull(),
    score: integer("score"),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_chapter_quizzes_user_roadmap_quiz_idx").on(
      table.userId,
      table.roadmapSlug,
      table.quizId,
    ),
    index("user_chapter_quizzes_user_id_idx").on(table.userId),
    index("user_chapter_quizzes_roadmap_slug_idx").on(table.roadmapSlug),
  ],
);

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon"),
    criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull().default({}),
    xpReward: integer("xp_reward").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("achievements_xp_reward_idx").on(table.xpReward)],
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_achievements_user_achievement_idx").on(
      table.userId,
      table.achievementId,
    ),
    index("user_achievements_user_id_idx").on(table.userId),
    index("user_achievements_achievement_id_idx").on(table.achievementId),
  ],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    logoUrl: text("logo_url"),
    website: text("website"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("organizations_name_idx").on(table.name)],
);

export const xpEvents = pgTable(
  "xp_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: xpSourceTypeEnum("source_type").notNull(),
    sourceKey: text("source_key").notNull(),
    amount: integer("amount").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("xp_events_user_source_idx").on(
      table.userId,
      table.sourceType,
      table.sourceKey,
    ),
    index("xp_events_user_id_idx").on(table.userId),
    index("xp_events_source_type_idx").on(table.sourceType),
  ],
);
