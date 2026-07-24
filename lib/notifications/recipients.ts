import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users } from "@/lib/db/schema";
import {
  normalizeEmailNotificationPrefs,
  type EmailNotificationPrefKey,
  type EmailNotificationPrefs,
} from "@/types/notifications";

export type NotificationRecipient = {
  id: string;
  email: string;
  displayName: string;
  username: string;
  prefs: EmailNotificationPrefs;
};

function mapRecipient(
  row: typeof users.$inferSelect,
): NotificationRecipient | null {
  const email = row.email?.trim();
  if (!email) {
    return null;
  }

  return {
    id: row.id,
    email,
    displayName: row.displayName,
    username: row.username,
    prefs: normalizeEmailNotificationPrefs(row.emailNotifications),
  };
}

export async function getNotificationRecipient(
  userId: string,
): Promise<NotificationRecipient | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  return row ? mapRecipient(row) : null;
}

export async function listReviewQueueRecipients(
  excludeUserId?: string,
): Promise<NotificationRecipient[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const conditions = [
    inArray(users.role, ["reviewer", "admin"]),
    isNotNull(users.email),
  ];

  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId));
  }

  const rows = await db
    .select()
    .from(users)
    .where(and(...conditions));

  return rows
    .map(mapRecipient)
    .filter((item): item is NotificationRecipient => item !== null)
    .filter((item) => item.prefs.reviewQueue);
}

export function recipientAllows(
  recipient: NotificationRecipient,
  key: EmailNotificationPrefKey,
): boolean {
  return recipient.prefs[key];
}

/** Prefer SQL filter when prefs JSON is well-formed; still normalize in JS. */
export async function updateEmailNotificationPrefs(
  userId: string,
  prefs: EmailNotificationPrefs,
): Promise<EmailNotificationPrefs | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
  const normalized = normalizeEmailNotificationPrefs(prefs);
  const [updated] = await db
    .update(users)
    .set({
      emailNotifications: normalized,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))
    .returning({ emailNotifications: users.emailNotifications });

  if (!updated) {
    return null;
  }

  return normalizeEmailNotificationPrefs(updated.emailNotifications);
}

export async function syncUserEmail(
  userId: string,
  email: string | null | undefined,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  const next = email?.trim() || null;
  const db = getDb();
  await db
    .update(users)
    .set({
      email: next,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(users.id, userId),
        sql`coalesce(${users.email}, '') is distinct from coalesce(${next}, '')`,
      ),
    );
}
