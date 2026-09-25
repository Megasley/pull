"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import {
  moderationBlockedMessage,
  requireActiveAccount,
} from "@/lib/auth/require-active-account";
import { listGithubRepositories } from "@/lib/github/store";
import { updateBuilderProfileFields } from "@/lib/profile/repository";
import { validateProfileEditInput } from "@/lib/profile/validate";
import { getBuilderProfile } from "@/lib/auth/ensure-builder-profile";

export async function updatePublicProfileAction(formData: FormData) {
  const gate = await requireActiveAccount();

  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: moderationBlockedMessage(gate.reason),
    };
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
    country: formData.has("country") ? formData.get("country") : undefined,
    showCountryPublicly: formData.get("showCountryPublicly"),
    openTo: formData.get("openTo"),
    pinnedRepos: formData.getAll("pinnedRepos").map(String),
  });

  if (!validation.ok) {
    return {
      ok: false as const,
      reason: "validation" as const,
      error: validation.error,
    };
  }

  // A pin can only point at a repo Pull has actually synced for this
  // builder — the settings UI only offers those as choices, but re-check
  // server-side since sync state can shift between page load and submit.
  const syncedRepos = await listGithubRepositories(gate.profile.id, { limit: 30 });
  const syncedRepoNames = new Set(syncedRepos.map((repo) => repo.fullName));
  const pinnedRepos = validation.data.pinnedRepos.filter((fullName) =>
    syncedRepoNames.has(fullName),
  );

  const updated = await updateBuilderProfileFields(gate.profile.id, {
    ...validation.data,
    pinnedRepos,
  });

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
