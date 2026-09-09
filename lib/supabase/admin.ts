import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Server-only, service-role Supabase client. Bypasses RLS entirely and is
 * the only client that can call privileged Admin API methods (e.g.
 * `auth.admin.deleteUser`) — the regular anon/session client used everywhere
 * else in this app can never do this, by design.
 *
 * Only ever import this from admin server actions/repository functions that
 * already gate on requireAdmin() (see app/actions/admin.ts). Never let it
 * anywhere near a client component or an unauthenticated code path.
 */
export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient(): SupabaseClient {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured — admin auth operations are unavailable.",
    );
  }

  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
