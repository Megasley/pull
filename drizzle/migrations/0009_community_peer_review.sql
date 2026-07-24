-- Community peer review: claim lock + multi-approval votes

DO $$ BEGIN
  CREATE TYPE "public"."review_decision" AS ENUM('approve', 'request_changes', 'reject');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

ALTER TABLE "project_submissions" ADD COLUMN IF NOT EXISTS "review_round" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN IF NOT EXISTS "claimed_by" uuid;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN IF NOT EXISTS "claim_expires_at" timestamp with time zone;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "project_submissions_claimed_by_idx" ON "project_submissions" USING btree ("claimed_by");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "submission_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"review_round" integer DEFAULT 1 NOT NULL,
	"decision" "review_decision" NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "submission_reviews_submission_reviewer_round_idx" ON "submission_reviews" USING btree ("submission_id","reviewer_id","review_round");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_reviews_submission_id_idx" ON "submission_reviews" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_reviews_reviewer_id_idx" ON "submission_reviews" USING btree ("reviewer_id");
