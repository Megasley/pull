-- Contribution and ecosystem impact measurement foundation.
--
-- Hand-authored rather than drizzle-kit-generated: this repo's migration
-- snapshot history has a pre-existing gap (meta/ only has snapshots for
-- 0000, 0001, and 0014 — 0002-0013 and 0015-0023 are missing from version
-- control), so `drizzle-kit generate` computes its diff against a stale
-- baseline and re-emits CREATE TABLE / ADD COLUMN statements for things
-- that already exist in the real database. Following the same defensive,
-- IF NOT EXISTS style already used in 0023 for the same reason. Purely
-- additive — no column is dropped, renamed, or narrowed; no row is deleted.

DO $$ BEGIN
  CREATE TYPE "public"."acquisition_source" AS ENUM('direct', 'organic', 'referral', 'partner', 'program', 'bootcamp', 'campaign', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."pr_lifecycle_event_type" AS ENUM('opened', 'ready_for_review', 'merged', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."event_timestamp_source" AS ENUM('github', 'sync_observed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."opportunity_source_type" AS ENUM('org_opportunity', 'discovery_repo', 'discovery_issue', 'project_catalog');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."opportunity_event_type" AS ENUM('viewed', 'clicked_github', 'saved', 'showed_interest');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."org_qualification_status" AS ENUM('none', 'qualified', 'completed', 'graduated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- users: geography + acquisition (both nullable/optional, never inferred)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "acquisition_source" "acquisition_source";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "acquisition_detail" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_country_idx" ON "users" USING btree ("country");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_acquisition_source_idx" ON "users" USING btree ("acquisition_source");
--> statement-breakpoint

-- github_pull_requests: durable-history support columns
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "is_own_repo" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "attributed_partner_id" uuid;
--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "attributed_opportunity_event_id" uuid;
--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "first_synced_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_repo_full_name_idx" ON "github_pull_requests" USING btree ("repo_full_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_attributed_partner_id_idx" ON "github_pull_requests" USING btree ("attributed_partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_is_own_repo_idx" ON "github_pull_requests" USING btree ("is_own_repo");
--> statement-breakpoint

-- github_pull_request_events: durable, append-only PR lifecycle ledger
CREATE TABLE IF NOT EXISTS "github_pull_request_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pull_request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "pr_lifecycle_event_type" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"timestamp_source" "event_timestamp_source" DEFAULT 'github' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "github_pull_request_events" ADD CONSTRAINT "github_pull_request_events_pull_request_id_github_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."github_pull_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "github_pull_request_events" ADD CONSTRAINT "github_pull_request_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_pull_request_events_pr_event_type_idx" ON "github_pull_request_events" USING btree ("pull_request_id","event_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_request_events_user_id_idx" ON "github_pull_request_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_request_events_user_event_occurred_idx" ON "github_pull_request_events" USING btree ("user_id","event_type","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_request_events_occurred_at_idx" ON "github_pull_request_events" USING btree ("occurred_at");
--> statement-breakpoint

-- opportunity_events: durable, first-party opportunity interaction log
CREATE TABLE IF NOT EXISTS "opportunity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"opportunity_key" text NOT NULL,
	"source_type" "opportunity_source_type" NOT NULL,
	"event_type" "opportunity_event_type" NOT NULL,
	"organization_id" uuid,
	"repo_full_name" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_events_user_key_type_idx" ON "opportunity_events" USING btree ("user_id","opportunity_key","event_type","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_events_key_type_idx" ON "opportunity_events" USING btree ("opportunity_key","event_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_events_organization_id_idx" ON "opportunity_events" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_events_repo_full_name_idx" ON "opportunity_events" USING btree ("repo_full_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_events_created_at_idx" ON "opportunity_events" USING btree ("created_at");
--> statement-breakpoint

-- github_pull_requests: FK to opportunity_events (created after the table above exists)
DO $$ BEGIN
  ALTER TABLE "github_pull_requests" ADD CONSTRAINT "github_pull_requests_attributed_partner_id_organizations_id_fk" FOREIGN KEY ("attributed_partner_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "github_pull_requests" ADD CONSTRAINT "github_pull_requests_attributed_opportunity_event_id_opportunity_events_id_fk" FOREIGN KEY ("attributed_opportunity_event_id") REFERENCES "public"."opportunity_events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- org_memberships: partner-controlled external-program qualification signal
ALTER TABLE "org_memberships" ADD COLUMN IF NOT EXISTS "qualification_status" "org_qualification_status" DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE "org_memberships" ADD COLUMN IF NOT EXISTS "qualified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "org_memberships" ADD COLUMN IF NOT EXISTS "qualified_by_user_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_qualified_by_user_id_users_id_fk" FOREIGN KEY ("qualified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_memberships_joined_at_idx" ON "org_memberships" USING btree ("joined_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_memberships_qualification_status_idx" ON "org_memberships" USING btree ("qualification_status");
--> statement-breakpoint

-- projects: admin-curated link to the real repo a catalog project sends contributors to
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "primary_repo_full_name" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_primary_repo_full_name_idx" ON "projects" USING btree ("primary_repo_full_name");
--> statement-breakpoint

-- Row-level security, matching the existing pattern on github_pull_requests /
-- users / xp_events (own-row read only; all writes happen server-side via the
-- direct Postgres connection in lib/db, which bypasses RLS as the postgres
-- role — these policies only matter if a table is ever reached through
-- Supabase's PostgREST API with a user JWT).
ALTER TABLE "github_pull_request_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "Users can read their own github pull request events"
    ON "github_pull_request_events" FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
ALTER TABLE "opportunity_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "Users can read their own opportunity events"
    ON "opportunity_events" FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
