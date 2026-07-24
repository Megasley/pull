CREATE TABLE IF NOT EXISTS "user_roadmap_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"roadmap_slug" text NOT NULL,
	"node_slug" text NOT NULL,
	"status" "progress_status" DEFAULT 'completed' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_roadmap_progress" ADD CONSTRAINT "user_roadmap_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_roadmap_progress_user_roadmap_node_idx" ON "user_roadmap_progress" USING btree ("user_id","roadmap_slug","node_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roadmap_progress_user_id_idx" ON "user_roadmap_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roadmap_progress_roadmap_slug_idx" ON "user_roadmap_progress" USING btree ("roadmap_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roadmap_progress_status_idx" ON "user_roadmap_progress" USING btree ("status");
