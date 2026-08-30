/** Isolated GitHub integration constants. */

export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

/** OAuth scopes requested at sign-in / reconnect. */
export const GITHUB_OAUTH_SCOPES = "read:user public_repo";

/** How often background sync should re-run for a user (Hobby cron is once daily). */
export const GITHUB_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Max pages when listing repositories (100 per page). */
export const GITHUB_REPO_MAX_PAGES = 10;

/** Cap recent activity rows stored per sync (GitHub Search API max per_page). */
export const GITHUB_ACTIVITY_LIMIT = 100;

/**
 * How many pages of authored-PR search results to fetch per sync (100/page).
 * GitHub's Search API caps at 1000 results total regardless; this stays well
 * under that to bound API usage. Raised from a single page (100 PRs) so
 * prolific contributors' older PRs are more likely to ever be discovered at
 * all — a PR that's never been in any fetched page can never be recorded.
 */
export const GITHUB_PR_SEARCH_MAX_PAGES = 3;

/**
 * Per-sync budget for per-PR detail enrichment (draft status, diff stats).
 * Only spent on PRs not already known-resolved from a prior sync — see
 * lib/github/store.ts:getResolvedGithubIds. Resolved PRs (merged or
 * closed) don't need re-enrichment since their terminal state can't change,
 * which frees this budget to concentrate on genuinely open/draft PRs where
 * the draft→ready transition actually matters.
 */
export const GITHUB_PR_ENRICH_BUDGET = 40;

/** Cap recent commits fetched across top repos. */
export const GITHUB_COMMIT_REPO_LIMIT = 8;
export const GITHUB_COMMITS_PER_REPO = 10;

export const GITHUB_USER_AGENT = "Pull/1.0";

/**
 * A PR is attributed to a tracked opportunity click-through only if the click
 * happened on a matching repo within this many days before the PR was opened.
 * Configurable, documented in docs/metrics-definitions.md. This is a
 * correlation rule, not proof of causation — see lib/github/attribution.ts.
 */
export const OPPORTUNITY_ATTRIBUTION_WINDOW_DAYS = 30;
