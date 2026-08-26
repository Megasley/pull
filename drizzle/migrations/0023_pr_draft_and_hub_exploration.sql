ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "draft" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_draft_idx" ON "github_pull_requests" USING btree ("draft");
--> statement-breakpoint
ALTER TABLE "org_memberships" ADD COLUMN IF NOT EXISTS "explored_opportunity_at" timestamp with time zone;
