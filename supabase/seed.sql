-- Local dev seed: grants + RLS policies
-- Covers what Supabase's auto_expose_new_tables once handled automatically,
-- plus the policies from supabase/migrations-backup/.
-- Idempotent: safe to run multiple times.

-- ============================================================
-- Schema / table grants
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- ============================================================
-- users
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users are publicly readable" ON public.users;
CREATE POLICY "Users are publicly readable"
  ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;

-- ============================================================
-- user_roadmap_progress
-- ============================================================
ALTER TABLE public.user_roadmap_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own roadmap progress" ON public.user_roadmap_progress;
CREATE POLICY "Users can read their own roadmap progress"
  ON public.user_roadmap_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own roadmap progress" ON public.user_roadmap_progress;
DROP POLICY IF EXISTS "Users can update their own roadmap progress" ON public.user_roadmap_progress;
DROP POLICY IF EXISTS "Users can delete their own roadmap progress" ON public.user_roadmap_progress;
REVOKE INSERT, UPDATE, DELETE ON public.user_roadmap_progress FROM anon, authenticated;

-- ============================================================
-- projects
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read projects" ON public.projects;
CREATE POLICY "Anyone can read projects"
  ON public.projects FOR SELECT USING (true);

-- ============================================================
-- project_submissions
-- ============================================================
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own submissions" ON public.project_submissions;
CREATE POLICY "Users can read their own submissions"
  ON public.project_submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.project_submissions;
CREATE POLICY "Users can insert their own submissions"
  ON public.project_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own submissions" ON public.project_submissions;
CREATE POLICY "Users can update their own submissions"
  ON public.project_submissions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own draft submissions" ON public.project_submissions;
CREATE POLICY "Users can delete their own draft submissions"
  ON public.project_submissions FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

-- ============================================================
-- submission_review_events
-- ============================================================
ALTER TABLE public.submission_review_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read events for their submissions" ON public.submission_review_events;
CREATE POLICY "Users can read events for their submissions"
  ON public.submission_review_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_submissions s
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

-- ============================================================
-- xp_events
-- ============================================================
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own xp events" ON public.xp_events;
CREATE POLICY "Users can read their own xp events"
  ON public.xp_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- github_* (access tokens must never be exposed via PostgREST)
-- ============================================================
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_contribution_days ENABLE ROW LEVEL SECURITY;

-- No SELECT policy on github_connections — tokens must not be readable by clients.

DROP POLICY IF EXISTS "Users can read their own github repositories" ON public.github_repositories;
CREATE POLICY "Users can read their own github repositories"
  ON public.github_repositories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github pull requests" ON public.github_pull_requests;
CREATE POLICY "Users can read their own github pull requests"
  ON public.github_pull_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github issues" ON public.github_issues;
CREATE POLICY "Users can read their own github issues"
  ON public.github_issues FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github commits" ON public.github_commits;
CREATE POLICY "Users can read their own github commits"
  ON public.github_commits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own github contribution days" ON public.github_contribution_days;
CREATE POLICY "Users can read their own github contribution days"
  ON public.github_contribution_days FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- submission_reviews
-- ============================================================
ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read submission reviews" ON public.submission_reviews;
CREATE POLICY "Authenticated users can read submission reviews"
  ON public.submission_reviews FOR SELECT TO authenticated USING (true);

-- ============================================================
-- organizations
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations are publicly readable" ON public.organizations;
CREATE POLICY "Organizations are publicly readable"
  ON public.organizations FOR SELECT USING (true);

-- ============================================================
-- user_weekly_goals
-- ============================================================
ALTER TABLE public.user_weekly_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own weekly goals" ON public.user_weekly_goals;
CREATE POLICY "Users can manage their own weekly goals"
  ON public.user_weekly_goals FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- user_chapter_quizzes
-- ============================================================
ALTER TABLE public.user_chapter_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chapter quizzes" ON public.user_chapter_quizzes;
DROP POLICY IF EXISTS "Users can read their own chapter quizzes" ON public.user_chapter_quizzes;
CREATE POLICY "Users can read their own chapter quizzes"
  ON public.user_chapter_quizzes FOR SELECT USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.user_chapter_quizzes FROM anon, authenticated;

-- ============================================================
-- admin tables: RLS on, no client policies (server-side only)
-- ============================================================
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_donations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- org invite links + org memberships (server-side only)
-- ============================================================
ALTER TABLE public.org_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own org memberships" ON public.org_memberships;
CREATE POLICY "Users can read their own org memberships"
  ON public.org_memberships FOR SELECT USING (auth.uid() = user_id);
