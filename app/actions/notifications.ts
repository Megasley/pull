"use server";

import { revalidatePath } from "next/cache";

import {
  moderationBlockedMessage,
  requireActiveAccount,
} from "@/lib/auth/require-active-account";
import { updateEmailNotificationPrefs } from "@/lib/notifications/recipients";
import {
  normalizeEmailNotificationPrefs,
  type EmailNotificationPrefs,
} from "@/types/notifications";

export async function updateEmailNotificationPrefsAction(formData: FormData) {
  const gate = await requireActiveAccount();

  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: moderationBlockedMessage(gate.reason),
    };
  }

  const prefs = normalizeEmailNotificationPrefs({
    reviewOutcomes: formData.get("reviewOutcomes") === "on",
    reviewQueue: formData.get("reviewQueue") === "on",
    achievements: formData.get("achievements") === "on",
    product: formData.get("product") === "on",
  } satisfies EmailNotificationPrefs);

  const updated = await updateEmailNotificationPrefs(gate.profile.id, prefs);

  if (!updated) {
    return {
      ok: false as const,
      reason: "database_unconfigured" as const,
      error: "Could not update notification preferences.",
    };
  }

  revalidatePath("/settings/notifications");
  return { ok: true as const, prefs: updated };
}
