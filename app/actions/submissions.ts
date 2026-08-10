"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import {
  moderationBlockedMessage,
  requireActiveAccount,
} from "@/lib/auth/require-active-account";
import {
  getActiveSubmission,
  listUserSubmissionsForProject,
  saveDraftSubmission,
  submitProjectSubmission,
} from "@/lib/submissions/repository";
import { validateSubmissionInput } from "@/lib/submissions/validate";
import { getProjectBySlug } from "@/lib/projects/catalog";

function revalidateSubmissionPaths(projectSlug: string) {
  revalidatePath(`/projects/${projectSlug}`);
  revalidatePath(`/projects/${projectSlug}/submit`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath("/admin");
}

export async function getProjectSubmissionStateAction(projectSlug: string) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authenticated: false as const,
      submissions: [] as Awaited<ReturnType<typeof listUserSubmissionsForProject>>,
      active: null,
    };
  }

  const submissions = await listUserSubmissionsForProject(user.id, projectSlug);
  const active = await getActiveSubmission(user.id, projectSlug);

  return {
    authenticated: true as const,
    submissions,
    active,
  };
}

export async function saveProjectDraftAction(projectSlug: string, formData: FormData) {
  const gate = await requireActiveAccount();

  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: moderationBlockedMessage(gate.reason),
    };
  }

  if (!getProjectBySlug(projectSlug)) {
    return { ok: false as const, reason: "project_not_found" as const };
  }

  const validation = validateSubmissionInput(
    {
      repoUrl: String(formData.get("repoUrl") ?? ""),
      prUrl: String(formData.get("prUrl") ?? ""),
      liveDemoUrl: String(formData.get("liveDemoUrl") ?? ""),
      videoDemoUrl: String(formData.get("videoDemoUrl") ?? ""),
      screenshotUrls: String(formData.get("screenshotUrls") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    },
    { requireRepo: false },
  );

  if (!validation.ok) {
    return {
      ok: false as const,
      reason: "validation" as const,
      error: validation.error,
    };
  }

  const result = await saveDraftSubmission(gate.profile.id, projectSlug, {
    repoUrl: validation.data.repoUrl,
    prUrl: validation.data.prUrl,
    liveDemoUrl: validation.data.liveDemoUrl,
    videoDemoUrl: validation.data.videoDemoUrl,
    screenshotUrls: validation.data.screenshotUrls,
    notes: validation.data.notes,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error:
        result.reason === "duplicate_active"
          ? "You already have an active submission for this project."
          : result.reason === "database_unconfigured"
            ? "Database is not configured."
            : "Could not save draft.",
    };
  }

  revalidateSubmissionPaths(projectSlug);
  return { ok: true as const, submission: result.submission };
}

export async function submitProjectAction(projectSlug: string, formData: FormData) {
  const gate = await requireActiveAccount();

  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: moderationBlockedMessage(gate.reason),
    };
  }

  if (!getProjectBySlug(projectSlug)) {
    return { ok: false as const, reason: "project_not_found" as const };
  }

  const validation = validateSubmissionInput(
    {
      repoUrl: String(formData.get("repoUrl") ?? ""),
      prUrl: String(formData.get("prUrl") ?? ""),
      liveDemoUrl: String(formData.get("liveDemoUrl") ?? ""),
      videoDemoUrl: String(formData.get("videoDemoUrl") ?? ""),
      screenshotUrls: String(formData.get("screenshotUrls") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    },
    { requireRepo: true },
  );

  if (!validation.ok) {
    return {
      ok: false as const,
      reason: "validation" as const,
      error: validation.error,
    };
  }

  const result = await submitProjectSubmission(gate.profile.id, projectSlug, {
    repoUrl: validation.data.repoUrl,
    prUrl: validation.data.prUrl,
    liveDemoUrl: validation.data.liveDemoUrl,
    videoDemoUrl: validation.data.videoDemoUrl,
    screenshotUrls: validation.data.screenshotUrls,
    notes: validation.data.notes,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error:
        result.reason === "duplicate_active"
          ? "You already have a submission in review for this project."
          : result.reason === "database_unconfigured"
            ? "Database is not configured."
            : "Could not submit project.",
    };
  }

  revalidateSubmissionPaths(projectSlug);
  return { ok: true as const, submission: result.submission };
}
