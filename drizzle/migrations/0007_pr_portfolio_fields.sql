ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "labels" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "language" text;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "files_changed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "additions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "deletions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "review_comments" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN IF NOT EXISTS "contribution_type" text DEFAULT 'other' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_merged_idx" ON "github_pull_requests" USING btree ("merged");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_pull_requests_contribution_type_idx" ON "github_pull_requests" USING btree ("contribution_type");
