/** GitHub OAuth / integration env checks (no secrets exposed). */

function isLocalSupabase(): boolean {
  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

/**
 * GitHub OAuth here is mediated entirely by Supabase Auth. Locally, the
 * Supabase CLI (supabase/config.toml's `[auth.external.github]` block)
 * reads its client id/secret from these two env vars, so checking them is
 * meaningful there. Against hosted Supabase (production/preview), the
 * GitHub provider is configured directly in the Supabase Dashboard —
 * entirely server-side, with no corresponding env var on this app at all —
 * so these vars are *always* absent regardless of whether GitHub sign-in
 * is actually configured and working. Checking them unconditionally made
 * this permanently report "missing" in production even though GitHub
 * sign-in was demonstrably working. Skip the check there instead of
 * guaranteeing a false alarm.
 */
export function isGithubOAuthConfigured(): boolean {
  if (!isLocalSupabase()) {
    return true;
  }
  return Boolean(
    process.env.SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID?.trim() &&
      process.env.SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET?.trim(),
  );
}
