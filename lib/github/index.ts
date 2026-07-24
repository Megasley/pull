/**
 * GitHub integration surface.
 * Keep all GitHub API / sync logic behind this module.
 */
export { GithubClient, GithubApiError } from "./client";
export { GITHUB_OAUTH_SCOPES, GITHUB_SYNC_INTERVAL_MS } from "./config";
export { getSessionGithubAccessToken } from "./auth";
export {
  connectGithubFromSession,
  loadGithubDashboardSnapshot,
  runGithubSync,
  syncDueGithubConnections,
  syncGithubForUser,
  isGithubSyncStale,
  getGithubConnectionPublic,
  listGithubRepositories,
  listGithubContributionDays,
} from "./service";

export {
  REPO_PAGE_SIZE,
  filterAndSortRepositories,
  paginateRepositories,
  getRepositoryLanguages,
  getRepoContributionStatus,
  CONTRIBUTION_STATUS_LABEL,
  formatRelativeUpdated,
} from "./explorer";
export type {
  RepoSort,
  RepoExplorerFilters,
  RepoContributionStatus,
} from "./explorer";
