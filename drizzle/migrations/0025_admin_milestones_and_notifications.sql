-- Admin milestone + activity notification system.
--
-- Hand-authored, following 0023/0024's IF NOT EXISTS style for the same
-- reason: this repo's migration snapshot history has a pre-existing gap, so
-- `drizzle-kit generate` would re-emit statements for things that already
-- exist. Purely additive — no column dropped, renamed, or narrowed.

DO $$ BEGIN
  CREATE TYPE "public"."milestone_type" AS ENUM(
    'first_opportunity_explored',
    'first_pr_opened',
    'first_pr_submitted',
    'first_pr_merged',
    'first_verified_contribution'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "milestone_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"milestone_type" "milestone_type" NOT NULL,
	"repository" text,
	"project_id" uuid,
	"pull_request_url" text,
	"pull_request_number" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"achieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "milestone_events" ADD CONSTRAINT "milestone_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "milestone_events" ADD CONSTRAINT "milestone_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "milestone_events_user_milestone_idx" ON "milestone_events" USING btree ("user_id","milestone_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "milestone_events_achieved_at_idx" ON "milestone_events" USING btree ("achieved_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "milestone_events_milestone_type_idx" ON "milestone_events" USING btree ("milestone_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_event_id" uuid NOT NULL,
	"subject_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_milestone_event_id_milestone_events_id_fk" FOREIGN KEY ("milestone_event_id") REFERENCES "public"."milestone_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_notifications_created_at_idx" ON "admin_notifications" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_notifications_unread_idx" ON "admin_notifications" USING btree ("read_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_notifications_subject_user_id_idx" ON "admin_notifications" USING btree ("subject_user_id");
--> statement-breakpoint

-- Row-level security, matching the pattern on github_pull_request_events /
-- opportunity_events (own-row read only; all real reads happen server-side
-- via the direct Postgres connection in lib/db, which bypasses RLS — this
-- only matters if a table is ever reached through Supabase's PostgREST API
-- with a user JWT). admin_notifications intentionally gets NO policy here:
-- it is admin-only data with no legitimate "read your own row" case, and
-- has no policy for the same reason admin_metrics_snapshots has none.
ALTER TABLE "milestone_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "Users can read their own milestone events"
    ON "milestone_events" FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
