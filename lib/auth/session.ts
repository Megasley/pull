import { createClientIfConfigured } from "@/lib/supabase/server";

import { ensureBuilderProfile, getBuilderProfile } from "./ensure-builder-profile";

export async function getCurrentUser() {
  const supabase = await createClientIfConfigured();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentBuilderProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getBuilderProfile(user.id);
}

export async function getCurrentSessionContext() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await getBuilderProfile(user.id);

  return { user, profile };
}

export async function bootstrapCurrentUserProfile() {
  const supabase = await createClientIfConfigured();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return ensureBuilderProfile(user);
}
