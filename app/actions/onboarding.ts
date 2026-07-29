"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { ensureWeeklyGoals } from "@/lib/dashboard/weekly-goals";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { users } from "@/lib/db/schema";

export async function completeOnboardingAction(input: {
  roadmapSlug: string;
  weeklyGoalTitle?: string;
}) {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }

  if (profile.onboardingCompletedAt) {
    return { ok: true as const, alreadyComplete: true as const };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false as const, reason: "database_unconfigured" as const };
  }

  const roadmapSlug = input.roadmapSlug.trim();
  if (roadmapSlug !== "bitcoin" && roadmapSlug !== "lightning") {
    return { ok: false as const, reason: "invalid_roadmap" as const };
  }

  const now = new Date().toISOString();

  try {
    const db = getDb();
    const [updated] = await db
      .update(users)
      .set({
        preferredRoadmapSlug: roadmapSlug,
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, profile.id))
      .returning({ id: users.id });

    if (!updated) {
      return { ok: false as const, reason: "not_found" as const };
    }
  } catch (error) {
    console.warn("[onboarding] completeOnboarding failed", error);
    return { ok: false as const, reason: "update_failed" as const };
  }

  try {
    await ensureWeeklyGoals(profile.id);
  } catch (error) {
    // Goals are best-effort; onboarding completion already persisted.
    console.warn("[onboarding] ensureWeeklyGoals failed", error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath(`/roadmaps/${roadmapSlug}`);

  return { ok: true as const, alreadyComplete: false as const };
}
