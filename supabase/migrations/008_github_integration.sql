-- Step 21: GitHub integration sync tables

DO $$ BEGIN
  CREATE TYPE public.github_sync_status AS ENUM (
    'idle',
    'syncing',
    'success',
    'error'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.github_connections (
  user_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  github_user_id bigint NOT NULL,
  login text NOT NULL,
  access_token text NOT NULL,
  scopes text NOT NULL DEFAULT '',
  avatar_url text,
  profile_url text,
  name text,
  bio text NOT NULL DEFAULT '',
  public_repos integer NOT NULL DEFAULT 0,
  followers integer NOT NULL DEFAULT 0,
  following integer NOT NULL DEFAULT 0,
  total_stars integer NOT NULL DEFAULT 0,
  sync_status public.github_sync_status NOT NULL DEFAULT 'idle',
  sync_error text,
  last_synced_at timestamptz,
  next_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS github_connections_login_idx
  ON public.github_connections (login);
CREATE INDEX IF NOT EXISTS github_connections_sync_status_idx
  ON public.github_connections (sync_status);
CREATE INDEX IF NOT EXISTS github_connections_next_sync_at_idx
  ON public.github_connections (next_sync_at);

CREATE TABLE IF NOT EXISTS public.github_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  github_id bigint NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL,
  description text,
  html_url text NOT NULL,
  language text,
  stargazers_count integer NOT NULL DEFAULT 0,
  forks_count integer NOT NULL DEFAULT 0,
  open_issues_count integer NOT NULL DEFAULT 0,
  license_spdx text,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_fork boolean NOT NULL DEFAULT false,
  is_private boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  default_branch text,
  pushed_at timestamptz,
  github_created_at timestamptz,
  github_updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT github_repositories_user_github_id_unique UNIQUE (user_id, github_id)
);

CREATE INDEX IF NOT EXISTS github_repositories_user_id_idx
  ON public.github_repositories (user_id);
CREATE INDEX IF NOT EXISTS github_repositories_language_idx
  ON public.github_repositories (language);
CREATE INDEX IF NOT EXISTS github_repositories_stargazers_idx
  ON public.github_repositories (stargazers_count);
CREATE INDEX IF NOT EXISTS github_repositories_pushed_at_idx
  ON public.github_repositories (pushed_at);

CREATE TABLE IF NOT EXISTS public.github_pull_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  github_id bigint NOT NULL,
  number integer NOT NULL,
  title text NOT NULL,
  state text NOT NULL,
  merged boolean NOT NULL DEFAULT false,
  repo_full_name text NOT NULL,
  html_url text NOT NULL,
  github_created_at timestamptz,
  github_closed_at timestamptz,
  github_merged_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT github_pull_requests_user_github_id_unique UNIQUE (user_id, github_id)
);

CREATE INDEX IF NOT EXISTS github_pull_requests_user_id_idx
  ON public.github_pull_requests (user_id);
CREATE INDEX IF NOT EXISTS github_pull_requests_state_idx
  ON public.github_pull_requests (state);

CREATE TABLE IF NOT EXISTS public.github_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  github_id bigint NOT NULL,
  number integer NOT NULL,
  title text NOT NULL,
  state text NOT NULL,
  repo_full_name text NOT NULL,
  html_url text NOT NULL,
  github_created_at timestamptz,
  github_closed_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT github_issues_user_github_id_unique UNIQUE (user_id, github_id)
);

CREATE INDEX IF NOT EXISTS github_issues_user_id_idx
  ON public.github_issues (user_id);
CREATE INDEX IF NOT EXISTS github_issues_state_idx
  ON public.github_issues (state);

CREATE TABLE IF NOT EXISTS public.github_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  sha text NOT NULL,
  message text NOT NULL,
  repo_full_name text NOT NULL,
  html_url text NOT NULL,
  committed_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT github_commits_user_sha_repo_unique UNIQUE (user_id, sha, repo_full_name)
);

CREATE INDEX IF NOT EXISTS github_commits_user_id_idx
  ON public.github_commits (user_id);
CREATE INDEX IF NOT EXISTS github_commits_committed_at_idx
  ON public.github_commits (committed_at);

CREATE TABLE IF NOT EXISTS public.github_contribution_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  contribution_date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  color text,
  synced_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT github_contribution_days_user_date_unique UNIQUE (user_id, contribution_date)
);

CREATE INDEX IF NOT EXISTS github_contribution_days_user_id_idx
  ON public.github_contribution_days (user_id);

ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_contribution_days ENABLE ROW LEVEL SECURITY;

-- Connections contain tokens — no direct client SELECT.
DROP POLICY IF EXISTS "Users cannot select github connections" ON public.github_connections;

DROP POLICY IF EXISTS "Users can read their own github repositories" ON public.github_repositories;
CREATE POLICY "Users can read their own github repositories"
  ON public.github_repositories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github pull requests" ON public.github_pull_requests;
CREATE POLICY "Users can read their own github pull requests"
  ON public.github_pull_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github issues" ON public.github_issues;
CREATE POLICY "Users can read their own github issues"
  ON public.github_issues FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github commits" ON public.github_commits;
CREATE POLICY "Users can read their own github commits"
  ON public.github_commits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github contribution days" ON public.github_contribution_days;
CREATE POLICY "Users can read their own github contribution days"
  ON public.github_contribution_days FOR SELECT
  USING (auth.uid() = user_id);
