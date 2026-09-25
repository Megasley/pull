CREATE TYPE "public"."open_to_status" AS ENUM('work', 'collaboration', 'mentoring', 'none');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_notifications" SET DEFAULT '{"reviewOutcomes":false,"reviewQueue":false,"achievements":true,"product":false,"qaActivity":false,"prReviewActivity":false,"prReviewDigest":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "open_to" "open_to_status";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pinned_repos" jsonb DEFAULT '[]'::jsonb NOT NULL;