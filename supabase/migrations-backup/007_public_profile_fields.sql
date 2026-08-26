-- Step 19: public profile social fields

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS website text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS twitter_url text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linkedin_url text;
