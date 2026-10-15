CREATE TABLE "pr_review_request_reviewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pr_review_request_reviewers" ADD CONSTRAINT "pr_review_request_reviewers_request_id_pr_review_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."pr_review_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_review_request_reviewers" ADD CONSTRAINT "pr_review_request_reviewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pr_review_request_reviewers_request_user_idx" ON "pr_review_request_reviewers" USING btree ("request_id","user_id");--> statement-breakpoint
CREATE INDEX "pr_review_request_reviewers_user_idx" ON "pr_review_request_reviewers" USING btree ("user_id");--> statement-breakpoint
INSERT INTO "pr_review_request_reviewers" ("request_id", "user_id", "reviewed_at")
SELECT "id", "reviewed_by_user_id", coalesce("reviewed_at", "updated_at")
FROM "pr_review_requests"
WHERE "reviewed_by_user_id" IS NOT NULL
ON CONFLICT DO NOTHING;
