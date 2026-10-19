/** Older bots that run as regular user accounts, so they have no `[bot]`
 *  suffix and GitHub reports their type as "User". */
const KNOWN_BOT_LOGINS = new Set([
  "dependabot",
  "dependabot-preview",
  "renovate",
  "renovate-bot",
  "renovatebot",
  "greenkeeper",
  "greenkeeperio-bot",
  "snyk-bot",
  "imgbot",
  "imgbotapp",
  "pyup-bot",
  "github-actions",
  "allcontributors",
  "pre-commit-ci",
  "mergify",
  "deepsource-autofix",
  "codecov-commenter",
]);

/**
 * True when a GitHub account is an automated bot, not a person. GitHub Apps
 * (Dependabot, Renovate, GitHub Actions, …) come back with a `[bot]` login
 * suffix and `type: "Bot"`; a handful of older bots use ordinary user
 * accounts and are matched by name.
 */
export function isBotAccount(
  login: string | null | undefined,
  type?: string | null,
): boolean {
  if (type?.toLowerCase() === "bot") {
    return true;
  }
  const normalized = (login ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return normalized.endsWith("[bot]") || KNOWN_BOT_LOGINS.has(normalized);
}

/** SQL `LIKE`/`IN` friendly list of the known bot logins, for queries that
 *  filter bot rows out in the database. */
export const KNOWN_BOT_LOGIN_LIST = [...KNOWN_BOT_LOGINS];
