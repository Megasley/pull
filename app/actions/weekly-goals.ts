"use server";

import { revalidatePath } from "next/cache";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { incrementCustomWeeklyGoal } from "@/lib/dashboard/weekly-goals";

export async function markWeeklyGoalDoneAction(goalId: string) {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }

  const goal = await incrementCustomWeeklyGoal(profile.id, goalId);
  revalidatePath("/dashboard");

  return { ok: true as const, goal };
}
