ALTER TABLE "pr_review_requests" ADD COLUMN "additions" integer;--> statement-breakpoint
ALTER TABLE "pr_review_requests" ADD COLUMN "deletions" integer;--> statement-breakpoint
ALTER TABLE "pr_review_requests" ADD COLUMN "files_changed" integer;