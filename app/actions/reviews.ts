"use server";

import { revalidatePath } from "next/cache";

import { requireActiveAccount } from "@/lib/auth/require-active-account";
import {
  isEligiblePeer,
  loadPeerReviewContext,
} from "@/lib/reviews/community";
import {
  applyReviewAction,
  getSubmissionForReview,
  listReviewQueue,
  listSubmissionTimeline,
} from "@/lib/reviews/repository";
import type { ReviewAction } from "@/types/submission";

async function requireReviewActor() {
  const gate = await requireActiveAccount();

  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  return { ok: true as const, user: { id: gate.profile.id }, profile: gate.profile };
}

function revalidateReviewPaths(submissionId: string, projectSlug?: string) {
  revalidatePath("/review");
  revalidatePath(`/review/${submissionId}`);
  if (projectSlug) {
    revalidatePath(`/projects/${projectSlug}/submit`);
    revalidatePath(`/projects/${projectSlug}`);
  }
  revalidatePath("/dashboard");
}

function mutationErrorMessage(reason: string) {
  switch (reason) {
    case "comment_required":
      return "A comment is required for this action.";
    case "invalid_transition":
      return "That status change is not allowed from the current state.";
    case "not_eligible":
      return "You are not eligible to review this submission yet. Complete the same project, raise your reputation, or get staff access.";
    case "own_submission":
      return "You cannot review your own submission.";
    case "claim_locked":
      return "Another reviewer currently holds this claim. Try again when it expires.";
    case "staff_only":
      return "Only staff reviewers can reject submissions.";
    default:
      return "Could not update the review.";
  }
}

export async function listReviewQueueAction() {
  const gate = await requireReviewActor();

  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason, items: [] };
  }

  const items = await listReviewQueue(gate.user.id);
  return { ok: true as const, items };
}

export async function getReviewDetailAction(submissionId: string) {
  const gate = await requireReviewActor();

  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const submission = await getSubmissionForReview(submissionId, gate.user.id);
  const timeline = submission
    ? await listSubmissionTimeline(submissionId)
    : [];

  return { ok: true as const, submission, timeline };
}

export async function applyReviewActionAction(
  submissionId: string,
  action: ReviewAction,
  comment?: string,
) {
  const gate = await requireReviewActor();

  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const existing = await getSubmissionForReview(submissionId, gate.user.id);
  if (!existing) {
    return {
      ok: false as const,
      reason: "not_found" as const,
      error: "Submission not found.",
    };
  }

  const ctx = await loadPeerReviewContext(gate.user.id, gate.profile.role);
  if (existing.userId === gate.user.id) {
    return {
      ok: false as const,
      reason: "own_submission" as const,
      error: mutationErrorMessage("own_submission"),
    };
  }

  if (!isEligiblePeer(ctx, existing)) {
    return {
      ok: false as const,
      reason: "not_eligible" as const,
      error: mutationErrorMessage("not_eligible"),
    };
  }

  const result = await applyReviewAction({
    submissionId,
    actorUserId: gate.user.id,
    actorRole: gate.profile.role,
    action,
    comment,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: mutationErrorMessage(result.reason),
    };
  }

  revalidateReviewPaths(submissionId, result.submission.projectSlug);
  return { ok: true as const, submission: result.submission };
}
