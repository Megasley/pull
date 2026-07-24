DO $$ BEGIN
  CREATE TYPE "public"."github_sync_status" AS ENUM('idle', 'syncing', 'success', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_connections" (
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_repositories" (
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_pull_requests" (
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
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_id" bigint NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"state" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"html_url" text NOT NULL,
	"github_created_at" timestamp with time zone,
	"github_closed_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sha" text NOT NULL,
	"message" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"html_url" text NOT NULL,
	"committed_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_contribution_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contribution_date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"color" text,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD CONSTRAINT "github_pull_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_issues" ADD CONSTRAINT "github_issues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_commits" ADD CONSTRAINT "github_commits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_contribution_days" ADD CONSTRAINT "github_contribution_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_connections_login_idx" ON "github_connections" USING btree ("login");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_connections_sync_status_idx" ON "github_connections" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_connections_next_sync_at_idx" ON "github_connections" USING btree ("next_sync_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_repositories_user_github_id_idx" ON "github_repositories" USING btree ("user_id","github_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_repositories_user_id_idx" ON "github_repositories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_repositories_language_idx" ON "github_repositories" USING btree ("language");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_repositories_stargazers_idx" ON "github_repositories" USING btree ("stargazers_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_repositories_pushed_at_idx" ON "github_repositories" USING btree ("pushed_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_pull_requests_user_github_id_idx" ON "github_pull_requests" USING btree ("user_id","github_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_user_id_idx" ON "github_pull_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_state_idx" ON "github_pull_requests" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_issues_user_github_id_idx" ON "github_issues" USING btree ("user_id","github_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_user_id_idx" ON "github_issues" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_issues_state_idx" ON "github_issues" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_commits_user_sha_repo_idx" ON "github_commits" USING btree ("user_id","sha","repo_full_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_commits_user_id_idx" ON "github_commits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_commits_committed_at_idx" ON "github_commits" USING btree ("committed_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_contribution_days_user_date_idx" ON "github_contribution_days" USING btree ("user_id","contribution_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_contribution_days_user_id_idx" ON "github_contribution_days" USING btree ("user_id");
