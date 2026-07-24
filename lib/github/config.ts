/** Isolated GitHub integration constants. */

export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

/** OAuth scopes requested at sign-in / reconnect. */
export const GITHUB_OAUTH_SCOPES = "read:user public_repo";

/** How often background sync should re-run for a user (Hobby cron is once daily). */
export const GITHUB_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Max pages when listing repositories (100 per page). */
export const GITHUB_REPO_MAX_PAGES = 10;

/** Cap recent activity rows stored per sync. */
export const GITHUB_ACTIVITY_LIMIT = 100;

/** Cap recent commits fetched across top repos. */
export const GITHUB_COMMIT_REPO_LIMIT = 8;
export const GITHUB_COMMITS_PER_REPO = 10;

export const GITHUB_USER_AGENT = "Pull/1.0";
