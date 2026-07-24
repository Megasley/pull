ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linkedin_url" text;
