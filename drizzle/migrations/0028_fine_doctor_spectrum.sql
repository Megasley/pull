ALTER TYPE "public"."milestone_type" ADD VALUE 'practice_first_pr_opened';--> statement-breakpoint
ALTER TYPE "public"."milestone_type" ADD VALUE 'practice_first_pr_submitted';--> statement-breakpoint
ALTER TYPE "public"."milestone_type" ADD VALUE 'practice_first_pr_merged';--> statement-breakpoint
ALTER TABLE "github_pull_requests" ADD COLUMN "is_practice_repo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "github_pull_requests_is_practice_repo_idx" ON "github_pull_requests" USING btree ("is_practice_repo");