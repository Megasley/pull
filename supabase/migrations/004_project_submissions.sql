-- BuilderOS project submissions extras + RLS (Phase 2, Step 15)

ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS live_demo_url text;

ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS video_demo_url text;

ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS screenshot_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read projects" ON public.projects;
CREATE POLICY "Anyone can read projects"
  ON public.projects
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can read their own submissions" ON public.project_submissions;
CREATE POLICY "Users can read their own submissions"
  ON public.project_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.project_submissions;
CREATE POLICY "Users can insert their own submissions"
  ON public.project_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own submissions" ON public.project_submissions;
CREATE POLICY "Users can update their own submissions"
  ON public.project_submissions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own draft submissions" ON public.project_submissions;
CREATE POLICY "Users can delete their own draft submissions"
  ON public.project_submissions
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');
