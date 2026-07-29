"use server";

import { revalidatePath } from "next/cache";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ensureWeeklyGoals } from "@/lib/dashboard/weekly-goals";

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

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("users")
    .update({
      preferred_roadmap_slug: input.roadmapSlug,
      onboarding_completed_at: now,
      updated_at: now,
    })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, reason: "update_failed" as const };
  }

  await ensureWeeklyGoals(profile.id);

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return { ok: true as const, alreadyComplete: false as const };
}
