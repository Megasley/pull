/** GitHub OAuth / integration env checks (no secrets exposed). */

export function isGithubOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim(),
  );
}
