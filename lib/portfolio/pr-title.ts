/**
 * Display-only PR title cleanup. The raw title from GitHub is always kept
 * in data (`item.title`) and used for search/filtering — only rendering
 * goes through these. Pure and dependency-free — see
 * tests/pr-presentation.test.ts.
 */

const CONVENTIONAL_COMMIT_PREFIX =
  /^(feat|fix|chore|docs|test|refactor|perf|style|build|ci|revert)(\([^)]*\))?[:/]\s*/i;

/** "Fix/backfill-pr-review-created-at" -> "Backfill pr review created at" */
function looksLikeBranchName(title: string): boolean {
  // A single path segment with no spaces, using - or _ as word separators,
  // is how a branch name reads once GitHub falls back to it as a PR title
  // (e.g. "Fix/backfill-pr-review-created-at" or "feat/pr_review_dashboard").
  return !title.includes(" ") && /[-_/]/.test(title);
}

/**
 * Strips a leading conventional-commit prefix ("feat:", "fix/", …) and,
 * for titles that otherwise read as a raw branch name, replaces the
 * remaining -, _, and / separators with spaces and sentence-cases the
 * result. Titles that already read as prose are returned unchanged (aside
 * from prefix stripping) so real sentences are never mangled.
 */
export function normalizePrTitleForDisplay(rawTitle: string): string {
  const title = rawTitle.trim();
  if (!title) return title;

  const withoutPrefix = title.replace(CONVENTIONAL_COMMIT_PREFIX, "").trim();
  const source = withoutPrefix || title;

  if (!looksLikeBranchName(source)) {
    return source;
  }

  const spaced = source
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!spaced) return source;

  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * Truncates on a word boundary (never mid-word) and appends an ellipsis.
 * Returns the input unchanged when it already fits.
 */
export function truncateOnWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const boundary = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;

  return `${boundary.trimEnd()}…`;
}
