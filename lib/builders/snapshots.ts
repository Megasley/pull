import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users } from "@/lib/db/schema";
import { loadOpenSourceReputation } from "@/lib/reputation";
import { loadBuilderScore } from "@/lib/score";

/** Persist the same Builder Score / OSS Reputation used on public profiles. */
export async function refreshUserScoreSnapshots(userId: string): Promise<{
  builderScore: number;
  ossReputation: number;
} | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const [builderScore, reputation] = await Promise.all([
      loadBuilderScore(userId),
      loadOpenSourceReputation(userId),
    ]);

    const db = getDb();
    await db
      .update(users)
      .set({
        builderScore: builderScore.score,
        ossReputation: reputation.score,
        scoresUpdatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    return {
      builderScore: builderScore.score,
      ossReputation: reputation.score,
    };
  } catch (error) {
    console.warn("[builders] score snapshot refresh failed", {
      userId,
      message: error instanceof Error ? error.message.slice(0, 200) : String(error),
    });
    return null;
  }
}

/** Non-blocking refresh for request paths that already computed live scores. */
export function persistScoreSnapshotsAsync(
  userId: string,
  scores: { builderScore: number; ossReputation: number },
) {
  if (!isDatabaseConfigured()) return;

  void (async () => {
    try {
      const db = getDb();
      await db
        .update(users)
        .set({
          builderScore: scores.builderScore,
          ossReputation: scores.ossReputation,
          scoresUpdatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.warn("[builders] score snapshot persist failed", {
        userId,
        message: error instanceof Error ? error.message.slice(0, 200) : String(error),
      });
    }
  })();
}
