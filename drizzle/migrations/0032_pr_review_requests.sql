CREATE TYPE "public"."pr_review_source_type" AS ENUM('admin_curated', 'peer_submitted');--> statement-breakpoint
CREATE TYPE "public"."pr_review_status" AS ENUM('needs_review', 'reviewed', 'closed', 'hidden');--> statement-breakpoint
ALTER TYPE "public"."xp_source_type" ADD VALUE 'pr_review_completed';--> statement-breakpoint
CREATE TABLE "pr_review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_url" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"author_login" text NOT NULL,
	"source_type" "pr_review_source_type" NOT NULL,
	"submitted_by_user_id" uuid,
	"status" "pr_review_status" DEFAULT 'needs_review' NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"hidden_at" timestamp with time zone,
	"hidden_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pr_review_requests" ADD CONSTRAINT "pr_review_requests_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_review_requests" ADD CONSTRAINT "pr_review_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pr_review_requests_status_idx" ON "pr_review_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pr_review_requests_source_type_idx" ON "pr_review_requests" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "pr_review_requests_submitted_by_idx" ON "pr_review_requests" USING btree ("submitted_by_user_id");--> statement-breakpoint
CREATE INDEX "pr_review_requests_repo_number_idx" ON "pr_review_requests" USING btree ("repo_full_name","number");--> statement-breakpoint
CREATE INDEX "pr_review_requests_flagged_idx" ON "pr_review_requests" USING btree ("flagged_for_review");