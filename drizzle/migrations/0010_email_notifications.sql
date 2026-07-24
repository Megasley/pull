-- Email delivery address + per-category notification preferences

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notifications" jsonb NOT NULL DEFAULT '{"reviewOutcomes":true,"reviewQueue":true,"achievements":true,"product":true}'::jsonb;
