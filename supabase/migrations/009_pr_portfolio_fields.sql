-- Step 26: Pull request portfolio enrichment fields

ALTER TABLE public.github_pull_requests
  ADD COLUMN IF NOT EXISTS labels jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.github_pull_requests
  ADD COLUMN IF NOT EXISTS language text;

ALTER TABLE public.github_pull_requests
  ADD COLUMN IF NOT EXISTS files_changed integer NOT NULL DEFAULT 0;

ALTER TABLE public.github_pull_requests
  ADD COLUMN IF NOT EXISTS additions integer NOT NULL DEFAULT 0;

ALTER TABLE public.github_pull_requests
  ADD COLUMN IF NOT EXISTS deletions integer NOT NULL DEFAULT 0;

ALTER TABLE public.github_pull_requests
  ADD COLUMN IF NOT EXISTS review_comments integer NOT NULL DEFAULT 0;

ALTER TABLE public.github_pull_requests
  ADD COLUMN IF NOT EXISTS contribution_type text NOT NULL DEFAULT 'other';

CREATE INDEX IF NOT EXISTS github_pull_requests_merged_idx
  ON public.github_pull_requests (merged);

CREATE INDEX IF NOT EXISTS github_pull_requests_contribution_type_idx
  ON public.github_pull_requests (contribution_type);
