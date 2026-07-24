import type { User } from "@supabase/supabase-js";

import { resolveUserRole } from "@/lib/auth/roles";
import { notifyWelcomeAsync } from "@/lib/notifications/dispatch";
import { createClient } from "@/lib/supabase/server";
import { mapBuilderProfile, type BuilderProfile } from "@/types/user";

/** Throttle DB writes — enough for MAU, light on write load. */
const ACTIVITY_TOUCH_MS = 60 * 60 * 1000;

function shouldTouchActivity(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return true;
  const last = Date.parse(lastActiveAt);
  if (Number.isNaN(last)) return true;
  return Date.now() - last >= ACTIVITY_TOUCH_MS;
}

function sanitizeUsername(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);

  return sanitized || "builder";
}

async function generateUniqueUsername(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseUsername: string,
): Promise<string> {
  let candidate = sanitizeUsername(baseUsername);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = `${sanitizeUsername(baseUsername)}-${attempt + 1}`;
  }

  return `${sanitizeUsername(baseUsername)}-${crypto.randomUUID().slice(0, 8)}`;
}

function getGithubIdentity(user: User) {
  const metadata = user.user_metadata ?? {};
  const githubUsername =
    (metadata.user_name as string | undefined) ??
    (metadata.preferred_username as string | undefined) ??
    user.email?.split("@")[0] ??
    "builder";

  const displayName =
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined) ??
    githubUsername;

  const avatar = (metadata.avatar_url as string | undefined) ?? null;
  const email = user.email?.trim() || null;

  return { githubUsername, displayName, avatar, email };
}

export async function ensureBuilderProfile(user: User): Promise<BuilderProfile | null> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const { githubUsername, displayName, avatar, email } = getGithubIdentity(user);

  if (existing) {
    const nextRole = resolveUserRole(
      existing.github_username ?? githubUsername,
      existing.role,
    );

    const existingEmail =
      typeof existing.email === "string" ? existing.email : null;
    const shouldUpdateRole = nextRole !== (existing.role ?? "builder");
    const shouldSyncEmail = Boolean(email) && email !== existingEmail;
    const lastActiveRaw =
      typeof existing.last_active_at === "string"
        ? existing.last_active_at
        : null;
    const shouldTouch = shouldTouchActivity(lastActiveRaw);

    if (shouldUpdateRole || shouldSyncEmail || shouldTouch) {
      const now = new Date().toISOString();
      const patch: Record<string, string> = {};
      if (shouldUpdateRole) {
        patch.role = nextRole;
        patch.updated_at = now;
      }
      if (shouldSyncEmail && email) {
        patch.email = email;
        patch.updated_at = now;
      }
      if (shouldTouch) {
        patch.last_active_at = now;
      }

      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update(patch)
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      return mapBuilderProfile(updated);
    }

    return mapBuilderProfile(existing);
  }

  const username = await generateUniqueUsername(supabase, githubUsername);
  const timestamp = new Date().toISOString();
  const role = resolveUserRole(githubUsername);

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({
      id: user.id,
      username,
      display_name: displayName,
      avatar,
      bio: "",
      github_username: githubUsername,
      email,
      role,
      xp: 0,
      level: 1,
      created_at: timestamp,
      updated_at: timestamp,
      last_active_at: timestamp,
    })
    .select("*")
    .single();

  if (createError) {
    if (createError.code === "23505") {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      return profile ? mapBuilderProfile(profile) : null;
    }

    throw createError;
  }

  const profile = mapBuilderProfile(created);
  notifyWelcomeAsync({
    userId: profile.id,
    displayName: profile.displayName,
    email: profile.email ?? email,
  });

  return profile;
}

export async function getBuilderProfile(
  userId: string,
): Promise<BuilderProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapBuilderProfile(data) : null;
}
