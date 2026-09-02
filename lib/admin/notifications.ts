import { and, count, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { adminNotifications, milestoneEvents, users } from "@/lib/db/schema";
import type { MilestoneType } from "@/lib/milestones/types";

export type AdminNotificationRecord = {
  id: string;
  title: string;
  description: string;
  readAt: string | null;
  createdAt: string;
  milestoneType: MilestoneType;
  repository: string | null;
  pullRequestUrl: string | null;
  pullRequestNumber: number | null;
  subjectUserId: string;
  subjectUsername: string;
  subjectDisplayName: string;
};

function selectShape() {
  return {
    id: adminNotifications.id,
    title: adminNotifications.title,
    description: adminNotifications.description,
    readAt: adminNotifications.readAt,
    createdAt: adminNotifications.createdAt,
    milestoneType: milestoneEvents.milestoneType,
    repository: milestoneEvents.repository,
    pullRequestUrl: milestoneEvents.pullRequestUrl,
    pullRequestNumber: milestoneEvents.pullRequestNumber,
    subjectUserId: users.id,
    subjectUsername: users.username,
    subjectDisplayName: users.displayName,
  };
}

function baseQuery() {
  const db = getDb();
  return db
    .select(selectShape())
    .from(adminNotifications)
    .innerJoin(milestoneEvents, eq(adminNotifications.milestoneEventId, milestoneEvents.id))
    .innerJoin(users, eq(adminNotifications.subjectUserId, users.id));
}

function mapRow(row: Awaited<ReturnType<typeof baseQuery>>[number]): AdminNotificationRecord {
  return {
    ...row,
    milestoneType: row.milestoneType as MilestoneType,
  };
}

export async function listAdminNotifications(input?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<{ notifications: AdminNotificationRecord[]; total: number }> {
  if (!isDatabaseConfigured()) {
    return { notifications: [], total: 0 };
  }

  const db = getDb();
  const limit = Math.min(Math.max(input?.limit ?? 20, 1), 100);
  const offset = Math.max(input?.offset ?? 0, 0);
  const where = input?.unreadOnly ? isNull(adminNotifications.readAt) : undefined;

  const [rows, totalRows] = await Promise.all([
    baseQuery().where(where).orderBy(desc(adminNotifications.createdAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(adminNotifications).where(where),
  ]);

  return {
    notifications: rows.map(mapRow),
    total: totalRows[0]?.value ?? 0,
  };
}

export async function countUnreadAdminNotifications(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(adminNotifications)
    .where(isNull(adminNotifications.readAt));
  return rows[0]?.value ?? 0;
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  await db
    .update(adminNotifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(adminNotifications.id, id), isNull(adminNotifications.readAt)));
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const db = getDb();
  await db
    .update(adminNotifications)
    .set({ readAt: new Date().toISOString() })
    .where(isNull(adminNotifications.readAt));
}
