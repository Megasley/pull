import type { User } from "@supabase/supabase-js";

import { eq } from "drizzle-orm";

import type { AcquisitionSignal } from "@/lib/auth/acquisition";
import { resolveUserRole } from "@/lib/auth/roles";
import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users } from "@/lib/db/schema";
import { notifyWelcomeAsync } from "@/lib/notifications/dispatch";
import { mapDrizzleUser } from "@/lib/profile/repository";
import type { BuilderProfile } from "@/types/user";

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

async function generateUniqueUsername(baseUsername: string): Promise<string> {
  const db = getDb();
  let candidate = sanitizeUsername(baseUsername);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);

    if (!rows[0]) return candidate;
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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function ensureBuilderProfile(
  user: User,
  options: { acquisition?: AcquisitionSignal } = {},
): Promise<BuilderProfile | null> {
  if (!isDatabaseConfigured()) return null;

  return withDbRetry(async () => {
    const db = getDb();
    const existingRows = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    const existing = existingRows[0];
    const { githubUsername, displayName, avatar, email } = getGithubIdentity(user);

    if (existing) {
      const nextRole = resolveUserRole(
        existing.githubUsername ?? githubUsername,
        existing.role,
      );
      const shouldUpdateRole = nextRole !== existing.role;
      const shouldSyncEmail = Boolean(email) && email !== existing.email;
      const shouldTouch = shouldTouchActivity(existing.lastActiveAt);

      if (shouldUpdateRole || shouldSyncEmail || shouldTouch) {
        const now = new Date().toISOString();
        const [updated] = await db
          .update(users)
          .set({
            ...(shouldUpdateRole ? { role: nextRole, updatedAt: now } : {}),
            ...(shouldSyncEmail && email ? { email, updatedAt: now } : {}),
            ...(shouldTouch ? { lastActiveAt: now } : {}),
          })
          .where(eq(users.id, user.id))
          .returning();

        return updated ? mapDrizzleUser(updated) : null;
      }

      return mapDrizzleUser(existing);
    }

    const username = await generateUniqueUsername(githubUsername);
    const timestamp = new Date().toISOString();
    const acquisition = options.acquisition;

    try {
      const [created] = await db
        .insert(users)
        .values({
          id: user.id,
          username,
          displayName,
          avatar,
          bio: "",
          githubUsername,
          email,
          role: resolveUserRole(githubUsername),
          xp: 0,
          level: 1,
          // First-touch only — never written again after this insert.
          acquisitionSource: acquisition?.source ?? "direct",
          acquisitionDetail: acquisition?.detail ?? {},
          createdAt: timestamp,
          updatedAt: timestamp,
          lastActiveAt: timestamp,
        })
        .returning();

      if (!created) return null;
      const profile = mapDrizzleUser(created);
      notifyWelcomeAsync({
        userId: profile.id,
        displayName: profile.displayName,
        email: profile.email ?? email,
      });
      return profile;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      return rows[0] ? mapDrizzleUser(rows[0]) : null;
    }
  });
}

export async function getBuilderProfile(
  userId: string,
): Promise<BuilderProfile | null> {
  if (!isDatabaseConfigured()) return null;

  return withDbRetry(async () => {
    const db = getDb();
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return rows[0] ? mapDrizzleUser(rows[0]) : null;
  });
}
