import { createClientIfConfigured } from "@/lib/supabase/server";

/**
 * Reads the GitHub OAuth provider token from the current Supabase session.
 * Callers should also persist it for background sync.
 */
export async function getSessionGithubAccessToken(): Promise<string | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.provider_token ?? null;
}

export async function getSessionGithubScopes(): Promise<string> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return "";

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const meta = session?.user?.app_metadata as
    | { provider?: string; providers?: string[] }
    | undefined;

  // Supabase does not always surface scopes; keep empty when unknown.
  void meta;
  return "";
}
