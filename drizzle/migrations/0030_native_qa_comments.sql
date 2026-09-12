CREATE TYPE "public"."comment_entity_type" AS ENUM('roadmap_step', 'project', 'developer_tool');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('visible', 'hidden', 'deleted');--> statement-breakpoint
ALTER TYPE "public"."xp_source_type" ADD VALUE 'qa_answer_accepted';--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "comment_entity_type" NOT NULL,
	"project_id" uuid,
	"roadmap_slug" text,
	"roadmap_node_slug" text,
	"developer_tool_slug" text,
	"thread_id" uuid,
	"is_question" boolean DEFAULT false NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"is_accepted_answer" boolean DEFAULT false NOT NULL,
	"accepted_at" timestamp with time zone,
	"status" "comment_status" DEFAULT 'visible' NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("body", ''))) STORED
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_thread_id_idx" ON "comments" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "comments_entity_project_idx" ON "comments" USING btree ("entity_type","project_id");--> statement-breakpoint
CREATE INDEX "comments_entity_roadmap_idx" ON "comments" USING btree ("roadmap_slug","roadmap_node_slug");--> statement-breakpoint
CREATE INDEX "comments_entity_tool_idx" ON "comments" USING btree ("developer_tool_slug");--> statement-breakpoint
CREATE INDEX "comments_author_id_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "comments_thread_accepted_idx" ON "comments" USING btree ("thread_id") WHERE "comments"."is_accepted_answer" = true;--> statement-breakpoint
CREATE INDEX "comments_search_vector_idx" ON "comments" USING gin ("search_vector");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_entity_identity_check" CHECK (
  (entity_type = 'project' AND project_id IS NOT NULL AND roadmap_slug IS NULL AND roadmap_node_slug IS NULL AND developer_tool_slug IS NULL) OR
  (entity_type = 'roadmap_step' AND roadmap_slug IS NOT NULL AND roadmap_node_slug IS NOT NULL AND project_id IS NULL AND developer_tool_slug IS NULL) OR
  (entity_type = 'developer_tool' AND developer_tool_slug IS NOT NULL AND project_id IS NULL AND roadmap_slug IS NULL AND roadmap_node_slug IS NULL)
);