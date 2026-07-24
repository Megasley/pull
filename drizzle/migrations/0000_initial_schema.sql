DO $$ BEGIN
  CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."node_status" AS ENUM('default', 'active', 'completed', 'locked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."progress_status" AS ENUM('not_started', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."resource_type" AS ENUM('article', 'video', 'documentation', 'repository', 'tool', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."roadmap_status" AS ENUM('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'builder_profiles'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE public.builder_profiles RENAME TO users;
    ALTER INDEX IF EXISTS builder_profiles_username_idx RENAME TO users_username_idx;
    ALTER INDEX IF EXISTS builder_profiles_github_username_idx RENAME TO users_github_username_idx;
    DROP TRIGGER IF EXISTS builder_profiles_set_updated_at ON public.users;
    DROP FUNCTION IF EXISTS public.set_builder_profiles_updated_at();
  END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"logo_url" text,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"repo_url" text,
	"pr_url" text,
	"notes" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"roadmap_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"estimated_duration" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"type" "resource_type" DEFAULT 'other' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"project_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"duration" text,
	"difficulty" "difficulty" DEFAULT 'beginner' NOT NULL,
	"status" "node_status" DEFAULT 'default' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"position_x" integer DEFAULT 24 NOT NULL,
	"position_y" integer DEFAULT 88 NOT NULL,
	"locked_until_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadmap_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"default_expanded" boolean DEFAULT true NOT NULL,
	"position_x" integer DEFAULT 0 NOT NULL,
	"position_y" integer DEFAULT 0 NOT NULL,
	"width" integer DEFAULT 340 NOT NULL,
	"height" integer DEFAULT 430 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "roadmap_status" DEFAULT 'draft' NOT NULL,
	"prerequisite_roadmap_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roadmaps_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text,
	"bio" text DEFAULT '' NOT NULL,
	"github_username" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "resources" ADD CONSTRAINT "resources_node_id_roadmap_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."roadmap_nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "roadmap_nodes" ADD CONSTRAINT "roadmap_nodes_section_id_roadmap_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."roadmap_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "roadmap_nodes" ADD CONSTRAINT "roadmap_nodes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "roadmap_sections" ADD CONSTRAINT "roadmap_sections_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_prerequisite_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("prerequisite_roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_node_id_roadmap_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."roadmap_nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "achievements_xp_reward_idx" ON "achievements" USING btree ("xp_reward");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_submissions_user_id_idx" ON "project_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_submissions_project_id_idx" ON "project_submissions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_submissions_status_idx" ON "project_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_roadmap_id_idx" ON "projects" USING btree ("roadmap_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_node_id_idx" ON "resources" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_type_idx" ON "resources" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roadmap_nodes_section_slug_idx" ON "roadmap_nodes" USING btree ("section_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmap_nodes_section_id_idx" ON "roadmap_nodes" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmap_nodes_project_id_idx" ON "roadmap_nodes" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roadmap_sections_roadmap_slug_idx" ON "roadmap_sections" USING btree ("roadmap_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmap_sections_roadmap_id_idx" ON "roadmap_sections" USING btree ("roadmap_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmaps_status_idx" ON "roadmaps" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmaps_prerequisite_roadmap_id_idx" ON "roadmaps" USING btree ("prerequisite_roadmap_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_achievements_user_achievement_idx" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_achievements_user_id_idx" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_achievements_achievement_id_idx" ON "user_achievements" USING btree ("achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_progress_user_node_idx" ON "user_progress" USING btree ("user_id","node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_progress_user_id_idx" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_progress_node_id_idx" ON "user_progress" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_progress_status_idx" ON "user_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_github_username_idx" ON "users" USING btree ("github_username");
