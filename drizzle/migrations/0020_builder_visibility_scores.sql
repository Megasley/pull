ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_public" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "listed_in_directory" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "builder_score" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "oss_reputation" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scores_updated_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_directory_listing_idx"
	ON "users" ("builder_score" DESC, "oss_reputation" DESC, "last_active_at" DESC)
	WHERE "account_status" = 'active'
		AND "profile_public" = true
		AND "listed_in_directory" = true;
