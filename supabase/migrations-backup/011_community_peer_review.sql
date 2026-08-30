-- Community peer review: claim lock + multi-approval votes

DO $$ BEGIN
  CREATE TYPE public.review_decision AS ENUM ('approve', 'request_changes', 'reject');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS review_round integer NOT NULL DEFAULT 1;

ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS project_submissions_claimed_by_idx
  ON public.project_submissions (claimed_by);

CREATE TABLE IF NOT EXISTS public.submission_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.project_submissions (id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  review_round integer NOT NULL DEFAULT 1,
  decision public.review_decision NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS submission_reviews_submission_reviewer_round_idx
  ON public.submission_reviews (submission_id, reviewer_id, review_round);

CREATE INDEX IF NOT EXISTS submission_reviews_submission_id_idx
  ON public.submission_reviews (submission_id);

CREATE INDEX IF NOT EXISTS submission_reviews_reviewer_id_idx
  ON public.submission_reviews (reviewer_id);

ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read submission reviews" ON public.submission_reviews;
CREATE POLICY "Authenticated users can read submission reviews"
  ON public.submission_reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Widen timeline read access so peers can see review history server-side clients use.
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
            WHERE u.id = auth.uid()
              AND u.role IN ('reviewer', 'admin')
          )
          OR auth.uid() IS NOT NULL
        )
    )
  );
