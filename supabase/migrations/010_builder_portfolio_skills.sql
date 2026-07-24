-- Step 28: Builder Portfolio skills

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]'::jsonb;
