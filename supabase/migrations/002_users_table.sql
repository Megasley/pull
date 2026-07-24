-- BuilderOS initial Drizzle schema (Phase 1, Step 8)
-- Renames builder_profiles -> users when upgrading from Step 7.

DO $$
BEGIN
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
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar text,
  bio text NOT NULL DEFAULT '',
  github_username text NOT NULL,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS users_username_idx ON public.users (username);
CREATE INDEX IF NOT EXISTS users_github_username_idx ON public.users (github_username);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Builder profiles are publicly readable" ON public.users;
DROP POLICY IF EXISTS "Users are publicly readable" ON public.users;
CREATE POLICY "Users are publicly readable"
  ON public.users
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own builder profile" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
CREATE POLICY "Users can create their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own builder profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_users_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_users_updated_at();

-- Remaining schema is applied via Drizzle migrations:
-- npm run db:migrate
