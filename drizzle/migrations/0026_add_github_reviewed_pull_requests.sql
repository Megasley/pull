CREATE TABLE "github_reviewed_pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_id" bigint NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"state" text NOT NULL,
	"merged" boolean DEFAULT false NOT NULL,
	"repo_full_name" text NOT NULL,
	"html_url" text NOT NULL,
	"author_login" text,
	"language" text,
	"github_created_at" timestamp with time zone,
	"github_updated_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_reviewed_pull_requests" ADD CONSTRAINT "github_reviewed_pull_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_reviewed_pull_requests_user_github_id_idx" ON "github_reviewed_pull_requests" USING btree ("user_id","github_id");--> statement-breakpoint
CREATE INDEX "github_reviewed_pull_requests_user_id_idx" ON "github_reviewed_pull_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_reviewed_pull_requests_repo_full_name_idx" ON "github_reviewed_pull_requests" USING btree ("repo_full_name");