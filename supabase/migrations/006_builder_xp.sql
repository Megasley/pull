-- Step 17: Builder XP events

DO $$ BEGIN
  CREATE TYPE public.xp_source_type AS ENUM (
    'lesson_complete',
    'project_submitted',
    'project_approved',
    'merged_pr',
    'roadmap_complete',
    'achievement'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  source_type public.xp_source_type NOT NULL,
  source_key text NOT NULL,
  amount integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT xp_events_user_source_unique UNIQUE (user_id, source_type, source_key)
);

CREATE INDEX IF NOT EXISTS xp_events_user_id_idx ON public.xp_events (user_id);
CREATE INDEX IF NOT EXISTS xp_events_source_type_idx ON public.xp_events (source_type);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own xp events" ON public.xp_events;
CREATE POLICY "Users can read their own xp events"
  ON public.xp_events
  FOR SELECT
  USING (auth.uid() = user_id);
