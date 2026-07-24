-- Step 16: review workflow fields and timeline

DO $$ BEGIN
  ALTER TYPE "public"."submission_status" ADD VALUE IF NOT EXISTS 'needs_changes';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('builder', 'reviewer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."review_event_type" AS ENUM('status_change', 'comment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'builder' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "submission_review_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"type" "review_event_type" NOT NULL,
	"from_status" "submission_status",
	"to_status" "submission_status",
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "submission_review_events" ADD CONSTRAINT "submission_review_events_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "submission_review_events" ADD CONSTRAINT "submission_review_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "submission_review_events_submission_id_idx" ON "submission_review_events" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_review_events_actor_user_id_idx" ON "submission_review_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_review_events_created_at_idx" ON "submission_review_events" USING btree ("created_at");
