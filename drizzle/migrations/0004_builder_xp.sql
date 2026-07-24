DO $$ BEGIN
  CREATE TYPE "public"."xp_source_type" AS ENUM(
    'lesson_complete',
    'project_submitted',
    'project_approved',
    'merged_pr',
    'roadmap_complete',
    'achievement'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" "xp_source_type" NOT NULL,
	"source_key" text NOT NULL,
	"amount" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "xp_events_user_source_idx" ON "xp_events" USING btree ("user_id","source_type","source_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "xp_events_user_id_idx" ON "xp_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "xp_events_source_type_idx" ON "xp_events" USING btree ("source_type");
