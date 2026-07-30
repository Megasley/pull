CREATE TABLE "admin_metrics_snapshots" (
	"id" text PRIMARY KEY DEFAULT 'overview' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text
);
