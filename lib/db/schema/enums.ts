import { pgEnum } from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const roadmapStatusEnum = pgEnum("roadmap_status", [
  "draft",
  "published",
  "archived",
]);

export const nodeStatusEnum = pgEnum("node_status", [
  "default",
  "active",
  "completed",
  "locked",
]);

export const progressStatusEnum = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "draft",
  "submitted",
  "under_review",
  "needs_changes",
  "approved",
  "rejected",
]);

export const userRoleEnum = pgEnum("user_role", ["builder", "reviewer", "admin"]);

export const userAccountStatusEnum = pgEnum("user_account_status", [
  "active",
  "suspended",
  "banned",
]);

export const reviewEventTypeEnum = pgEnum("review_event_type", [
  "status_change",
  "comment",
]);

export const reviewDecisionEnum = pgEnum("review_decision", [
  "approve",
  "request_changes",
  "reject",
]);

export const xpSourceTypeEnum = pgEnum("xp_source_type", [
  "lesson_complete",
  "chapter_quiz_passed",
  "project_submitted",
  "project_approved",
  "merged_pr",
  "roadmap_complete",
  "achievement",
]);

export const resourceTypeEnum = pgEnum("resource_type", [
  "article",
  "video",
  "documentation",
  "repository",
  "tool",
  "other",
]);

export const githubSyncStatusEnum = pgEnum("github_sync_status", [
  "idle",
  "syncing",
  "success",
  "error",
]);

export const weeklyGoalTargetTypeEnum = pgEnum("weekly_goal_target_type", [
  "open_pr",
  "merge_pr",
  "complete_lesson",
  "custom",
]);

export const chapterQuizStatusEnum = pgEnum("chapter_quiz_status", [
  "passed",
  "skipped",
]);
