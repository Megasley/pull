import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

export function createClientIfConfigured() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
