CREATE TABLE IF NOT EXISTS "org_invite_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"seat_cap" integer,
	"seat_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_invite_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"invite_link_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"skill" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'beginner' NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contribution_type" text,
	"repository_url" text,
	"issue_url" text,
	"why_recommended" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "org_invite_links" ADD CONSTRAINT "org_invite_links_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_invite_link_id_org_invite_links_id_fk"
    FOREIGN KEY ("invite_link_id") REFERENCES "public"."org_invite_links"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "org_skills" ADD CONSTRAINT "org_skills_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "org_opportunities" ADD CONSTRAINT "org_opportunities_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "org_invite_links_token_hash_idx" ON "org_invite_links" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_invite_links_organization_id_idx" ON "org_invite_links" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_invite_links_status_idx" ON "org_invite_links" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "org_memberships_org_user_idx" ON "org_memberships" USING btree ("organization_id","user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_memberships_organization_id_idx" ON "org_memberships" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_memberships_user_id_idx" ON "org_memberships" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "org_skills_organization_skill_idx" ON "org_skills" USING btree ("organization_id","skill");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_skills_organization_id_idx" ON "org_skills" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_opportunities_organization_id_idx" ON "org_opportunities" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_opportunities_difficulty_idx" ON "org_opportunities" USING btree ("difficulty");
