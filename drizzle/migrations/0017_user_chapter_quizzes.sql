-- Repair: 0014 was journaled but chapter quiz objects were missing on some DBs.
DO $$ BEGIN
	CREATE TYPE "public"."chapter_quiz_status" AS ENUM('passed', 'skipped');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TYPE "public"."xp_source_type" ADD VALUE IF NOT EXISTS 'chapter_quiz_passed';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_chapter_quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"roadmap_slug" text NOT NULL,
	"quiz_id" text NOT NULL,
	"status" "chapter_quiz_status" NOT NULL,
	"score" integer,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "user_chapter_quizzes"
		ADD CONSTRAINT "user_chapter_quizzes_user_id_users_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_chapter_quizzes_user_roadmap_quiz_idx"
	ON "user_chapter_quizzes" USING btree ("user_id","roadmap_slug","quiz_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_chapter_quizzes_user_id_idx"
	ON "user_chapter_quizzes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_chapter_quizzes_roadmap_slug_idx"
	ON "user_chapter_quizzes" USING btree ("roadmap_slug");
