"use server";

import { revalidatePath } from "next/cache";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import {
  connectGithubFromSession,
  runGithubSync,
} from "@/lib/github";

export type GithubActionResult =
  | { ok: true; summary?: { repositories: number; pullRequests: number; issues: number; commits: number } }
  | { ok: false; error: string; reason?: "unauthenticated" };

export async function connectGithubAction(): Promise<GithubActionResult> {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) {
    return { ok: false, error: "Sign in required.", reason: "unauthenticated" };
  }

  const connected = await connectGithubFromSession(profile.id);
  if (!connected.ok) {
    return { ok: false, error: connected.error ?? "Could not connect GitHub." };
  }

  const sync = await runGithubSync(profile.id, { preferSessionToken: true });
  revalidatePath("/settings/github");
  revalidatePath("/dashboard");

  if (!sync.ok) {
    return { ok: false, error: sync.error };
  }

  return {
    ok: true,
    summary: {
      repositories: sync.summary.repositories,
      pullRequests: sync.summary.pullRequests,
      issues: sync.summary.issues,
      commits: sync.summary.commits,
    },
  };
}

export async function refreshGithubSyncAction(): Promise<GithubActionResult> {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) {
    return { ok: false, error: "Sign in required.", reason: "unauthenticated" };
  }

  const sync = await runGithubSync(profile.id, { preferSessionToken: true });
  revalidatePath("/settings/github");
  revalidatePath("/dashboard");

  if (!sync.ok) {
    return { ok: false, error: sync.error };
  }

  return {
    ok: true,
    summary: {
      repositories: sync.summary.repositories,
      pullRequests: sync.summary.pullRequests,
      issues: sync.summary.issues,
      commits: sync.summary.commits,
    },
  };
}
