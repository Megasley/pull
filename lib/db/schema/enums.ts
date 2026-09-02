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

export const organizationTypeEnum = pgEnum("organization_type", [
  "team",
  "learning_partner",
  "hackathon",
]);

export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "inactive",
]);

/** First-touch acquisition bucket, set once at account creation and never overwritten. */
export const acquisitionSourceEnum = pgEnum("acquisition_source", [
  "direct",
  "organic",
  "referral",
  "partner",
  "program",
  "bootcamp",
  "campaign",
  "other",
]);

/** Durable PR lifecycle transitions. See lib/github/store.ts:recordPullRequestEvents. */
export const prLifecycleEventTypeEnum = pgEnum("pr_lifecycle_event_type", [
  "opened",
  "ready_for_review",
  "merged",
  "closed",
]);

/**
 * Precision of a pr_lifecycle event's `occurredAt`:
 * - "github": exact timestamp from GitHub's API (created_at / merged_at / closed_at)
 * - "sync_observed": no exact timestamp is available (e.g. draft->ready has no
 *   REST/Search API field); this is when Pull's periodic sync first noticed the
 *   transition, not when it actually happened.
 */
export const eventTimestampSourceEnum = pgEnum("event_timestamp_source", [
  "github",
  "sync_observed",
]);

/** First-time contribution milestones. See lib/milestones/. */
export const milestoneTypeEnum = pgEnum("milestone_type", [
  "first_opportunity_explored",
  "first_pr_opened",
  "first_pr_submitted",
  "first_pr_merged",
  "first_verified_contribution",
]);

export const opportunitySourceTypeEnum = pgEnum("opportunity_source_type", [
  "org_opportunity",
  "discovery_repo",
  "discovery_issue",
  "project_catalog",
]);

export const opportunityEventTypeEnum = pgEnum("opportunity_event_type", [
  "viewed",
  "clicked_github",
  "saved",
  "showed_interest",
]);

/** Partner/program-controlled signal that an external pathway (e.g. Thebuidl's
 *  own curriculum) was completed — set only via an authorized admin/partner action. */
export const orgQualificationStatusEnum = pgEnum("org_qualification_status", [
  "none",
  "qualified",
  "completed",
  "graduated",
]);

