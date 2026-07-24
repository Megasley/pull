ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "skills" jsonb DEFAULT '[]'::jsonb NOT NULL;
