-- Pull slug-based roadmap progress (Phase 1, Step 11)

CREATE TABLE IF NOT EXISTS public.user_roadmap_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  roadmap_slug text NOT NULL,
  node_slug text NOT NULL,
  status public.progress_status NOT NULL DEFAULT 'completed',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT user_roadmap_progress_user_roadmap_node_unique
    UNIQUE (user_id, roadmap_slug, node_slug)
);

CREATE INDEX IF NOT EXISTS user_roadmap_progress_user_id_idx
  ON public.user_roadmap_progress (user_id);

CREATE INDEX IF NOT EXISTS user_roadmap_progress_roadmap_slug_idx
  ON public.user_roadmap_progress (roadmap_slug);

CREATE INDEX IF NOT EXISTS user_roadmap_progress_status_idx
  ON public.user_roadmap_progress (status);

ALTER TABLE public.user_roadmap_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own roadmap progress" ON public.user_roadmap_progress;
CREATE POLICY "Users can read their own roadmap progress"
  ON public.user_roadmap_progress
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own roadmap progress" ON public.user_roadmap_progress;
CREATE POLICY "Users can insert their own roadmap progress"
  ON public.user_roadmap_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own roadmap progress" ON public.user_roadmap_progress;
CREATE POLICY "Users can update their own roadmap progress"
  ON public.user_roadmap_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own roadmap progress" ON public.user_roadmap_progress;
CREATE POLICY "Users can delete their own roadmap progress"
  ON public.user_roadmap_progress
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_user_roadmap_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_roadmap_progress_set_updated_at ON public.user_roadmap_progress;
CREATE TRIGGER user_roadmap_progress_set_updated_at
BEFORE UPDATE ON public.user_roadmap_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_user_roadmap_progress_updated_at();
