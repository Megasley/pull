import { getSessionGithubAccessToken } from "./auth";
import { GITHUB_SYNC_INTERVAL_MS } from "./config";
import {
  countGithubSyncedEntities,
  getGithubConnectionPublic,
  listConnectionsDueForSync,
  listGithubContributionDays,
  listGithubRepositories,
  upsertGithubConnection,
} from "./store";
import { fetchAuthenticatedUser } from "./api";
import { GithubClient } from "./client";
import { syncGithubForUser } from "./sync";
import type { GithubDashboardSnapshot } from "@/types/github";

/**
 * Persist provider token and ensure connection row.
 * Pass `accessToken` when calling from `after()` (cookies unavailable there).
 */
export async function connectGithubFromSession(
  userId: string,
  options: { accessToken?: string | null } = {},
): Promise<{
  ok: boolean;
  error?: string;
}> {
  const token =
    options.accessToken !== undefined
      ? options.accessToken
      : await getSessionGithubAccessToken();

  if (!token) {
    return {
      ok: false,
      error: "No GitHub access token in session. Reconnect GitHub to grant API access.",
    };
  }

  try {
    const client = new GithubClient(token);
    const user = await fetchAuthenticatedUser(client);
    await upsertGithubConnection({
      userId,
      githubUserId: user.id,
      login: user.login,
      accessToken: token,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      name: user.name,
      bio: user.bio ?? "",
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      syncStatus: "idle",
      nextSyncAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not connect GitHub",
    };
  }
}

export async function refreshGithubAccessTokenFromSession(userId: string) {
  void userId;
  const token = await getSessionGithubAccessToken();
  if (!token) return null;
  return token;
}

export async function runGithubSync(
  userId: string,
  options: {
    /** Read provider token from the live session (request context only — not inside `after()`). */
    preferSessionToken?: boolean;
    /** Pre-fetched token for use inside `after()` where `cookies()` is unavailable. */
    accessToken?: string | null;
  } = {},
) {
  const accessToken =
    options.accessToken !== undefined
      ? options.accessToken
      : options.preferSessionToken
        ? await getSessionGithubAccessToken()
        : null;

  return syncGithubForUser(userId, { accessToken });
}

export async function loadGithubDashboardSnapshot(
  userId: string,
): Promise<GithubDashboardSnapshot> {
  const connection = await getGithubConnectionPublic(userId);

  if (!connection) {
    return {
      connection: { connected: false },
      pinnedRepos: [],
      recentRepos: [],
      contributionDays: [],
      totals: { repositories: 0, pullRequests: 0, issues: 0, commits: 0 },
    };
  }

  const [pinnedRepos, recentRepos, contributionDays, totals] = await Promise.all([
    listGithubRepositories(userId, { pinnedOnly: true, limit: 6 }),
    listGithubRepositories(userId, { limit: 6 }),
    listGithubContributionDays(userId),
    countGithubSyncedEntities(userId),
  ]);

  return {
    connection,
    pinnedRepos: pinnedRepos.length > 0 ? pinnedRepos : recentRepos.slice(0, 6),
    recentRepos,
    contributionDays,
    totals,
  };
}

export function isGithubSyncStale(lastSyncedAt: string | null | undefined) {
  if (!lastSyncedAt) return true;
  const age = Date.now() - Date.parse(lastSyncedAt);
  return !Number.isFinite(age) || age >= GITHUB_SYNC_INTERVAL_MS;
}

export async function syncDueGithubConnections(limit = 10) {
  const due = await listConnectionsDueForSync(limit);
  const results: Array<{ userId: string; ok: boolean; error?: string }> = [];

  for (const row of due) {
    const result = await syncGithubForUser(row.userId);
    results.push(
      result.ok
        ? { userId: row.userId, ok: true }
        : { userId: row.userId, ok: false, error: result.error },
    );
  }

  return results;
}

export {
  syncGithubForUser,
  getGithubConnectionPublic,
  listGithubRepositories,
  listGithubContributionDays,
};
