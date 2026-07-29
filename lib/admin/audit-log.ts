import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { adminAuditLog } from "@/lib/db/schema";

export type AdminAuditAction =
  | "role_change"
  | "suspend"
  | "ban"
  | "restore";

export type AdminAuditEntry = {
  id: string;
  actorUserId: string;
  targetUserId: string | null;
  action: AdminAuditAction | string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function recordAdminAction(input: {
  actorUserId: string;
  targetUserId?: string | null;
  action: AdminAuditAction | string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  const db = getDb();
  await db.insert(adminAuditLog).values({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId ?? null,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}

export async function listAuditLogForUser(
  userId: string,
  limit = 20,
): Promise<AdminAuditEntry[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.targetUserId, userId))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      actorUserId: row.actorUserId,
      targetUserId: row.targetUserId,
      action: row.action,
      metadata: row.metadata ?? {},
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.warn("[admin] listAuditLogForUser failed", error);
    return [];
  }
}
