import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users, xpEvents } from "@/lib/db/schema";
import { XP_REWARDS } from "@/lib/xp/config";
import { levelFromXp } from "@/lib/xp/levels";
import type { XpAwardResult, XpSourceType } from "@/types/xp";

async function readUserTotals(userId: string): Promise<{ xp: number; level: number }> {
  const db = getDb();
  const rows = await db
    .select({ xp: users.xp, level: users.level })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { xp: 0, level: 1 };
  }

  const xp = Math.max(0, Number(row.xp) || 0);
  const level = row.level && row.level > 0 ? row.level : levelFromXp(xp);
  return { xp, level };
}

export async function reconcileUserXpTotals(
  userId: string,
): Promise<{ xp: number; level: number }> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [{ xp }] = await tx
      .select({
        xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)`,
      })
      .from(xpEvents)
      .where(eq(xpEvents.userId, userId))
      .for("update");

    const safeXp = Math.max(0, Number(xp) || 0);
    const level = levelFromXp(safeXp);

    await tx
      .update(users)
      .set({
        xp: safeXp,
        level,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    return { xp: safeXp, level };
  });
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

  const db = getDb();

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ xp: users.xp })
      .from(users)
      .where(eq(users.id, input.userId))
      .for("update");

    if (!locked && amount <= 0) {
      return { awarded: false, amount: 0, totalXp: 0, level: 1 };
    }

    if (amount <= 0) {
      const xp = Math.max(0, Number(locked?.xp) || 0);
      return { awarded: false, amount: 0, totalXp: xp, level: levelFromXp(xp) };
    }

    const inserted = await tx
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

    const wasAwarded = inserted.length > 0;
    const currentXp = Math.max(0, Number(locked?.xp) || 0);
    const nextXp = wasAwarded ? currentXp + amount : currentXp;
    const nextLevel = levelFromXp(nextXp);

    if (wasAwarded) {
      await tx
        .update(users)
        .set({
          xp: nextXp,
          level: nextLevel,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, input.userId));
    }

    return {
      awarded: wasAwarded,
      amount: wasAwarded ? amount : 0,
      totalXp: nextXp,
      level: nextLevel,
    };
  });
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

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ xp: users.xp })
      .from(users)
      .where(eq(users.id, input.userId))
      .for("update");

    const currentXp = Math.max(0, Number(locked?.xp) || 0);

    const deleted = await tx
      .delete(xpEvents)
      .where(
        and(
          eq(xpEvents.userId, input.userId),
          eq(xpEvents.sourceType, input.sourceType),
          eq(xpEvents.sourceKey, input.sourceKey),
        ),
      )
      .returning({ amount: xpEvents.amount });

    const revokedAmount = deleted.reduce(
      (sum, row) => sum + Math.max(0, Number(row.amount) || 0),
      0,
    );
    const nextXp = Math.max(0, currentXp - revokedAmount);
    const nextLevel = levelFromXp(nextXp);

    if (revokedAmount > 0) {
      await tx
        .update(users)
        .set({
          xp: nextXp,
          level: nextLevel,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, input.userId));
    }

    return {
      awarded: true,
      amount: 0,
      totalXp: nextXp,
      level: nextLevel,
    };
  });
}

export async function getUserXpTotals(userId: string) {
  if (!isDatabaseConfigured()) {
    return { xp: 0, level: 1 };
  }

  return readUserTotals(userId);
}
