"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { updateBuilderProfileFields } from "@/lib/profile/repository";
import { validateProfileEditInput } from "@/lib/profile/validate";
import { getBuilderProfile } from "@/lib/auth/ensure-builder-profile";

export async function updatePublicProfileAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }

  const validation = validateProfileEditInput({
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    website: String(formData.get("website") ?? ""),
    twitterUrl: String(formData.get("twitterUrl") ?? ""),
    linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
    skills: String(formData.get("skills") ?? ""),
    lookingFor: formData.getAll("lookingFor").map(String),
    profilePublic: formData.get("profilePublic"),
    listedInDirectory: formData.get("listedInDirectory"),
  });

  if (!validation.ok) {
    return { ok: false as const, reason: "validation" as const, error: validation.error };
  }

  const updated = await updateBuilderProfileFields(user.id, validation.data);

  if (!updated) {
    return {
      ok: false as const,
      reason: "database_unconfigured" as const,
      error: "Could not update profile.",
    };
  }

  revalidatePath(`/u/${updated.username}`);
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  revalidatePath("/builders");
  revalidatePath("/");

  return { ok: true as const, profile: updated };
}

export async function getOwnProfileAction() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getBuilderProfile(user.id);
}
