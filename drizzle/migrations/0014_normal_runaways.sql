CREATE TYPE "public"."chapter_quiz_status" AS ENUM('passed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."github_sync_status" AS ENUM('idle', 'syncing', 'success', 'error');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approve', 'request_changes', 'reject');--> statement-breakpoint
CREATE TYPE "public"."review_event_type" AS ENUM('status_change', 'comment');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('builder', 'reviewer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."weekly_goal_target_type" AS ENUM('open_pr', 'merge_pr', 'complete_lesson', 'custom');--> statement-breakpoint
CREATE TYPE "public"."xp_source_type" AS ENUM('lesson_complete', 'chapter_quiz_passed', 'project_submitted', 'project_approved', 'merged_pr', 'roadmap_complete', 'achievement');--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'needs_changes' BEFORE 'approved';--> statement-breakpoint
CREATE TABLE "github_commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sha" text NOT NULL,
	"message" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"html_url" text NOT NULL,
	"committed_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_connections" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"github_user_id" bigint NOT NULL,
	"login" text NOT NULL,
	"access_token" text NOT NULL,
	"scopes" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"profile_url" text,
	"name" text,
	"bio" text DEFAULT '' NOT NULL,
	"public_repos" integer DEFAULT 0 NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"following" integer DEFAULT 0 NOT NULL,
	"total_stars" integer DEFAULT 0 NOT NULL,
	"sync_status" "github_sync_status" DEFAULT 'idle' NOT NULL,
	"sync_error" text,
	"last_synced_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_contribution_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contribution_date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"color" text,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_id" bigint NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"state" text NOT NULL,
	"relation" text DEFAULT 'authored' NOT NULL,
	"repo_full_name" text NOT NULL,
	"html_url" text NOT NULL,
	"github_created_at" timestamp with time zone,
	"github_closed_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_id" bigint NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"state" text NOT NULL,
	"merged" boolean DEFAULT false NOT NULL,
	"repo_full_name" text NOT NULL,
	"html_url" text NOT NULL,
	"github_created_at" timestamp with time zone,
	"github_closed_at" timestamp with time zone,
	"github_merged_at" timestamp with time zone,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"language" text,
	"files_changed" integer DEFAULT 0 NOT NULL,
	"additions" integer DEFAULT 0 NOT NULL,
	"deletions" integer DEFAULT 0 NOT NULL,
	"review_comments" integer DEFAULT 0 NOT NULL,
	"contribution_type" text DEFAULT 'other' NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_id" bigint NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"description" text,
	"html_url" text NOT NULL,
	"language" text,
	"stargazers_count" integer DEFAULT 0 NOT NULL,
	"forks_count" integer DEFAULT 0 NOT NULL,
	"open_issues_count" integer DEFAULT 0 NOT NULL,
	"license_spdx" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_fork" boolean DEFAULT false NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"default_branch" text,
	"pushed_at" timestamp with time zone,
	"github_created_at" timestamp with time zone,
	"github_updated_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_weekly_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start" text NOT NULL,
	"title" text NOT NULL,
	"target_type" "weekly_goal_target_type" NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"progress_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_review_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"type" "review_event_type" NOT NULL,
	"from_status" "submission_status",
	"to_status" "submission_status",
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"review_round" integer DEFAULT 1 NOT NULL,
	"decision" "review_decision" NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_chapter_quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"roadmap_slug" text NOT NULL,
	"quiz_id" text NOT NULL,
	"status" "chapter_quiz_status" NOT NULL,
	"score" integer,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" "xp_source_type" NOT NULL,
	"source_key" text NOT NULL,
	"amount" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "live_demo_url" text;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "video_demo_url" text;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "screenshot_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "review_round" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "claimed_by" uuid;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "claim_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "skills" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_notifications" jsonb DEFAULT '{"reviewOutcomes":true,"reviewQueue":true,"achievements":true,"product":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'builder' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "github_commits" ADD CONSTRAINT "github_commits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_contribution_days" ADD CONSTRAINT "github_contribution_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_issues" ADD CONSTRAINT "github_issues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD CONSTRAINT "github_pull_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_weekly_goals" ADD CONSTRAINT "user_weekly_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_review_events" ADD CONSTRAINT "submission_review_events_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_review_events" ADD CONSTRAINT "submission_review_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chapter_quizzes" ADD CONSTRAINT "user_chapter_quizzes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_commits_user_sha_repo_idx" ON "github_commits" USING btree ("user_id","sha","repo_full_name");--> statement-breakpoint
CREATE INDEX "github_commits_user_id_idx" ON "github_commits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_commits_committed_at_idx" ON "github_commits" USING btree ("committed_at");--> statement-breakpoint
CREATE INDEX "github_connections_login_idx" ON "github_connections" USING btree ("login");--> statement-breakpoint
CREATE INDEX "github_connections_sync_status_idx" ON "github_connections" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "github_connections_next_sync_at_idx" ON "github_connections" USING btree ("next_sync_at");--> statement-breakpoint
CREATE UNIQUE INDEX "github_contribution_days_user_date_idx" ON "github_contribution_days" USING btree ("user_id","contribution_date");--> statement-breakpoint
CREATE INDEX "github_contribution_days_user_id_idx" ON "github_contribution_days" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_issues_user_github_id_idx" ON "github_issues" USING btree ("user_id","github_id");--> statement-breakpoint
CREATE INDEX "github_issues_user_id_idx" ON "github_issues" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_issues_state_idx" ON "github_issues" USING btree ("state");--> statement-breakpoint
CREATE INDEX "github_issues_relation_idx" ON "github_issues" USING btree ("relation");--> statement-breakpoint
CREATE UNIQUE INDEX "github_pull_requests_user_github_id_idx" ON "github_pull_requests" USING btree ("user_id","github_id");--> statement-breakpoint
CREATE INDEX "github_pull_requests_user_id_idx" ON "github_pull_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_pull_requests_state_idx" ON "github_pull_requests" USING btree ("state");--> statement-breakpoint
CREATE INDEX "github_pull_requests_merged_idx" ON "github_pull_requests" USING btree ("merged");--> statement-breakpoint
CREATE INDEX "github_pull_requests_contribution_type_idx" ON "github_pull_requests" USING btree ("contribution_type");--> statement-breakpoint
CREATE UNIQUE INDEX "github_repositories_user_github_id_idx" ON "github_repositories" USING btree ("user_id","github_id");--> statement-breakpoint
CREATE INDEX "github_repositories_user_id_idx" ON "github_repositories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_repositories_language_idx" ON "github_repositories" USING btree ("language");--> statement-breakpoint
CREATE INDEX "github_repositories_stargazers_idx" ON "github_repositories" USING btree ("stargazers_count");--> statement-breakpoint
CREATE INDEX "github_repositories_pushed_at_idx" ON "github_repositories" USING btree ("pushed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_weekly_goals_user_week_title_idx" ON "user_weekly_goals" USING btree ("user_id","week_start","title");--> statement-breakpoint
CREATE INDEX "user_weekly_goals_user_id_idx" ON "user_weekly_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_weekly_goals_week_start_idx" ON "user_weekly_goals" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "submission_review_events_submission_id_idx" ON "submission_review_events" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_review_events_actor_user_id_idx" ON "submission_review_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "submission_review_events_created_at_idx" ON "submission_review_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_reviews_submission_reviewer_round_idx" ON "submission_reviews" USING btree ("submission_id","reviewer_id","review_round");--> statement-breakpoint
CREATE INDEX "submission_reviews_submission_id_idx" ON "submission_reviews" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_reviews_reviewer_id_idx" ON "submission_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_chapter_quizzes_user_roadmap_quiz_idx" ON "user_chapter_quizzes" USING btree ("user_id","roadmap_slug","quiz_id");--> statement-breakpoint
CREATE INDEX "user_chapter_quizzes_user_id_idx" ON "user_chapter_quizzes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_chapter_quizzes_roadmap_slug_idx" ON "user_chapter_quizzes" USING btree ("roadmap_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "xp_events_user_source_idx" ON "xp_events" USING btree ("user_id","source_type","source_key");--> statement-breakpoint
CREATE INDEX "xp_events_user_id_idx" ON "xp_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "xp_events_source_type_idx" ON "xp_events" USING btree ("source_type");--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_submissions_claimed_by_idx" ON "project_submissions" USING btree ("claimed_by");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_last_active_at_idx" ON "users" USING btree ("last_active_at");