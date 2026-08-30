/** GitHub OAuth / integration env checks (no secrets exposed). */

/**
 * GitHub OAuth here is mediated entirely by Supabase Auth (see
 * supabase/config.toml's `[auth.external.github]` block), which reads its
 * client id/secret from these two vars — not a generic GITHUB_CLIENT_ID /
 * GITHUB_CLIENT_SECRET pair, which this codebase never actually uses
 * anywhere else. Checking the wrong names made this always report "missing"
 * even when GitHub sign-in was demonstrably working.
 */
export function isGithubOAuthConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID?.trim() &&
      process.env.SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET?.trim(),
  );
}
