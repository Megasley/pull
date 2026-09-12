-- Learning progress is validated and persisted by trusted server actions.
-- Authenticated browser clients may read their own state but cannot write it directly.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;--> statement-breakpoint

ALTER TABLE public.user_roadmap_progress ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can insert their own roadmap progress" ON public.user_roadmap_progress;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can update their own roadmap progress" ON public.user_roadmap_progress;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can delete their own roadmap progress" ON public.user_roadmap_progress;--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON public.user_roadmap_progress FROM anon, authenticated;--> statement-breakpoint

ALTER TABLE public.user_chapter_quizzes ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can manage their own chapter quizzes" ON public.user_chapter_quizzes;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read their own chapter quizzes" ON public.user_chapter_quizzes;--> statement-breakpoint
CREATE POLICY "Users can read their own chapter quizzes"
  ON public.user_chapter_quizzes
  FOR SELECT
  USING (auth.uid() = user_id);--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON public.user_chapter_quizzes FROM anon, authenticated;
