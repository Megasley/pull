-- Product activity timestamp for monthly active users (MAU)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active_at" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "users_last_active_at_idx" ON "users" ("last_active_at");
