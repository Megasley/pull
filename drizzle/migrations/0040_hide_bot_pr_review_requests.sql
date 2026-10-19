-- Hide PRs opened by bots (Dependabot, Renovate, GitHub Actions, …) that are
-- still waiting in the review queue. Matches lib/github/bots.ts: a "[bot]"
-- login suffix, or one of the older bots that use ordinary user accounts.
-- Reviewed rows are left alone (their reviewers keep their XP history); the
-- public lists filter bot authors out at query time.
UPDATE "pr_review_requests"
SET "status" = 'hidden',
  "hidden_at" = now(),
  "hidden_reason" = 'bot_author',
  "updated_at" = now()
WHERE "status" = 'needs_review'
  AND (
    lower("author_login") LIKE '%[bot]'
    OR lower("author_login") IN ('dependabot', 'dependabot-preview', 'renovate', 'renovate-bot', 'renovatebot', 'greenkeeper', 'greenkeeperio-bot', 'snyk-bot', 'imgbot', 'imgbotapp', 'pyup-bot', 'github-actions', 'allcontributors', 'pre-commit-ci', 'mergify', 'deepsource-autofix', 'codecov-commenter')
  );
