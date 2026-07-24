import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users, xpEvents } from "@/lib/db/schema";
import { XP_REWARDS } from "@/lib/xp/config";
import { levelFromXp } from "@/lib/xp/levels";
import type { XpAwardResult, XpSourceType } from "@/types/xp";

async function syncUserXpTotals(userId: string): Promise<{ xp: number; level: number }> {
  const db = getDb();
  const totals = await db
    .select({
      xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)`,
    })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId));

  const xp = Number(totals[0]?.xp ?? 0);
  const level = levelFromXp(xp);

  await db
    .update(users)
    .set({
      xp,
      level,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));

  return { xp, level };
}

export async function awardXp(input: {
  userId: string;
  sourceType: XpSourceType;
  sourceKey: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}): Promise<XpAwardResult> {
  if (!isDatabaseConfigured()) {
    return { awarded: false, amount: 0, totalXp: 0, level: 1 };
  }

  const amount =
    input.amount ??
    (input.sourceType === "achievement" ? 0 : XP_REWARDS[input.sourceType]);

  if (amount <= 0) {
    const totals = await syncUserXpTotals(input.userId);
    return { awarded: false, amount: 0, totalXp: totals.xp, level: totals.level };
  }

  const db = getDb();
  const inserted = await db
    .insert(xpEvents)
    .values({
      userId: input.userId,
      sourceType: input.sourceType,
      sourceKey: input.sourceKey,
      amount,
      metadata: input.metadata ?? {},
    })
    .onConflictDoNothing({
      target: [xpEvents.userId, xpEvents.sourceType, xpEvents.sourceKey],
    })
    .returning({ id: xpEvents.id });

  const totals = await syncUserXpTotals(input.userId);

  return {
    awarded: inserted.length > 0,
    amount: inserted.length > 0 ? amount : 0,
    totalXp: totals.xp,
    level: totals.level,
  };
}

export async function revokeXp(input: {
  userId: string;
  sourceType: XpSourceType;
  sourceKey: string;
}): Promise<XpAwardResult> {
  if (!isDatabaseConfigured()) {
    return { awarded: false, amount: 0, totalXp: 0, level: 1 };
  }

  const db = getDb();
  await db
    .delete(xpEvents)
    .where(
      and(
        eq(xpEvents.userId, input.userId),
        eq(xpEvents.sourceType, input.sourceType),
        eq(xpEvents.sourceKey, input.sourceKey),
      ),
    );

  const totals = await syncUserXpTotals(input.userId);
  return {
    awarded: true,
    amount: 0,
    totalXp: totals.xp,
    level: totals.level,
  };
}

export async function getUserXpTotals(userId: string) {
  if (!isDatabaseConfigured()) {
    return { xp: 0, level: 1 };
  }

  return syncUserXpTotals(userId);
}
