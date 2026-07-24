-- Weekly OSS goals for dashboard

DO $$ BEGIN
  CREATE TYPE "weekly_goal_target_type" AS ENUM (
    'open_pr',
    'merge_pr',
    'complete_lesson',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "user_weekly_goals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "week_start" text NOT NULL,
  "title" text NOT NULL,
  "target_type" "weekly_goal_target_type" NOT NULL,
  "target_count" integer NOT NULL DEFAULT 1,
  "progress_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_weekly_goals_user_week_title_idx"
  ON "user_weekly_goals" ("user_id", "week_start", "title");
CREATE INDEX IF NOT EXISTS "user_weekly_goals_user_id_idx"
  ON "user_weekly_goals" ("user_id");
CREATE INDEX IF NOT EXISTS "user_weekly_goals_week_start_idx"
  ON "user_weekly_goals" ("week_start");
