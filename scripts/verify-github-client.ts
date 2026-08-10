/**
 * Smoke checks for GitHub client helpers (no network).
 * Run: npx tsx scripts/verify-github-client.ts
 */
import { GithubApiError } from "../lib/github/client";
import { isGithubSyncStale } from "../lib/github/service";
import { GITHUB_SYNC_INTERVAL_MS } from "../lib/github/config";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const err = new GithubApiError("rate limited", {
  status: 403,
  rateLimitRemaining: 0,
  rateLimitReset: Math.floor(Date.now() / 1000) + 30,
  retryable: true,
});
assert(err.retryable, "rate limit errors should be retryable");
assert(err.status === 403, "status should be 403");

assert(isGithubSyncStale(null), "null last sync is stale");
assert(
  isGithubSyncStale(
    new Date(Date.now() - GITHUB_SYNC_INTERVAL_MS - 1000).toISOString(),
  ),
  "old sync should be stale",
);
assert(!isGithubSyncStale(new Date().toISOString()), "fresh sync should not be stale");

console.log("GitHub client helper checks passed.");
