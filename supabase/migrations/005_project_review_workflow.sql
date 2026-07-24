-- Step 16: review workflow (Supabase)

DO $$ BEGIN
  ALTER TYPE public.submission_status ADD VALUE IF NOT EXISTS 'needs_changes';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('builder', 'reviewer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.review_event_type AS ENUM ('status_change', 'comment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'builder';

CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);

CREATE TABLE IF NOT EXISTS public.submission_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.project_submissions (id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  type public.review_event_type NOT NULL,
  from_status public.submission_status,
  to_status public.submission_status,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS submission_review_events_submission_id_idx
  ON public.submission_review_events (submission_id);

CREATE INDEX IF NOT EXISTS submission_review_events_actor_user_id_idx
  ON public.submission_review_events (actor_user_id);

CREATE INDEX IF NOT EXISTS submission_review_events_created_at_idx
  ON public.submission_review_events (created_at);

ALTER TABLE public.submission_review_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read events for their submissions" ON public.submission_review_events;
CREATE POLICY "Users can read events for their submissions"
  ON public.submission_review_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_submissions s
      WHERE s.id = submission_id
        AND (
          s.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('reviewer', 'admin')
          )
        )
    )
  );
