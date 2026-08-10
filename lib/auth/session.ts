import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClientIfConfigured } from "@/lib/supabase/server";

import { ensureBuilderProfile, getBuilderProfile } from "./ensure-builder-profile";

/**
 * Request-scoped auth lookup. Navbar, AuthControls, and pages often call this
 * in the same render — without cache that is 2–3 sequential Supabase round-trips.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClientIfConfigured();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentBuilderProfile = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getBuilderProfile(user.id);
});

/**
 * Ensures the builder row exists and env-based roles are applied.
 * Cached per request so layout + page share one bootstrap.
 */
export const bootstrapCurrentUserProfile = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return ensureBuilderProfile(user);
});

export const getCurrentSessionContext = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, profile: null };
  }

  // Bootstrap (not plain get) so allowlisted admins/reviewers sync on first paint.
  const profile = await bootstrapCurrentUserProfile();

  return { user, profile };
});
