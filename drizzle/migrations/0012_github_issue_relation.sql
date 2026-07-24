-- Issue relation: authored vs assigned (for dashboard assigned-issues)

ALTER TABLE "github_issues" ADD COLUMN IF NOT EXISTS "relation" text NOT NULL DEFAULT 'authored';
CREATE INDEX IF NOT EXISTS "github_issues_relation_idx" ON "github_issues" ("relation");
