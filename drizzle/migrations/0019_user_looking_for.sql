ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "looking_for" jsonb DEFAULT '[]'::jsonb NOT NULL;
