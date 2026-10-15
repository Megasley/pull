CREATE TYPE "public"."submitted_issue_status" AS ENUM('pending', 'approved', 'rejected', 'closed');--> statement-breakpoint
CREATE TABLE "submitted_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_url" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"language" text,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tracks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_hours" integer NOT NULL,
	"summary" text NOT NULL,
	"status" "submitted_issue_status" DEFAULT 'pending' NOT NULL,
	"submitted_by_user_id" uuid,
	"moderated_by_user_id" uuid,
	"moderated_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submitted_issues" ADD CONSTRAINT "submitted_issues_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_issues" ADD CONSTRAINT "submitted_issues_moderated_by_user_id_users_id_fk" FOREIGN KEY ("moderated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submitted_issues_repo_number_idx" ON "submitted_issues" USING btree ("repo_full_name","number");--> statement-breakpoint
CREATE INDEX "submitted_issues_status_idx" ON "submitted_issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submitted_issues_submitted_by_idx" ON "submitted_issues" USING btree ("submitted_by_user_id");