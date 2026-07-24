ALTER TABLE "project_submissions" ADD COLUMN IF NOT EXISTS "live_demo_url" text;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN IF NOT EXISTS "video_demo_url" text;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN IF NOT EXISTS "screenshot_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;
