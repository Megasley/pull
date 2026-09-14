"use server";

import { revalidatePath } from "next/cache";

import { recordAdminAction } from "@/lib/admin/audit-log";
import { requireActiveAccount } from "@/lib/auth/require-active-account";
import {
  createReviewRequest,
  hideReviewRequest,
  listAllReviewRequests,
  listMyReviewedRequests,
  listMySubmissions,
  listReviewRequestsForViewer,
  previewPullRequestForReview,
  reportOwnReview,
  restoreOwnReviewRequest,
  unhideReviewRequest,
  withdrawOwnReviewRequest,
} from "@/lib/pr-reviews/repository";

async function requirePrReviewActor() {
  const gate = await requireActiveAccount();
  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }
  return { ok: true as const, profile: gate.profile };
}

function prReviewErrorMessage(reason: string) {
  switch (reason) {
    case "invalid_url":
      return "That doesn't look like a GitHub pull request URL.";
    case "github_not_connected":
      return "Connect your GitHub account before submitting a PR for review.";
    case "pr_not_found":
      return "Could not find that pull request on GitHub. Check the URL and that it's public.";
    case "not_found":
      return "This review request no longer exists.";
    case "rate_limited":
      return "You're submitting too fast. Try again in a moment.";
    case "already_submitted":
      return "This PR is already in the review queue.";
    case "already_resolved":
      return "This request has already moved on. Refresh the page to see its current status.";
    case "is_own_pr":
      return "You can't review your own PR.";
    case "no_review_found":
      return "We couldn't find a review from you on that PR yet. Leave one on GitHub first, then try again.";
    case "check_failed":
      return "Couldn't check GitHub right now. Try again in a moment.";
    case "not_owner":
      return "You can only withdraw your own submission.";
    case "not_withdrawn":
      return "This wasn't withdrawn by you, so it can't be restored this way.";
    case "staff_only":
      return "Only staff can hide a review request.";
    case "suspended":
      return "Your account is suspended. This is disabled until an admin restores access.";
    case "banned":
      return "Your account has been banned.";
    default:
      return "Sign in to continue.";
  }
}

function revalidatePrReviewPaths() {
  revalidatePath("/pr-reviews");
}

export async function listReviewRequestsAction() {
  const profile = await requireActiveAccount();
  const viewerGithubUsername = profile.ok ? profile.profile.githubUsername : null;
  const requests = await listReviewRequestsForViewer(viewerGithubUsername);
  return { ok: true as const, requests, viewerSignedIn: profile.ok };
}

export async function previewPrForReviewAction(prUrl: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  const result = await previewPullRequestForReview({ prUrl, userId: gate.profile.id });
  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  return { ok: true as const, preview: result.preview };
}

export async function submitPrForReviewAction(prUrl: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  const result = await createReviewRequest({
    prUrl,
    sourceType: "peer_submitted",
    submittedByUserId: gate.profile.id,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  revalidatePrReviewPaths();
  return { ok: true as const, id: result.id };
}

export async function submitCuratedPrForReviewAction(prUrl: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  if (gate.profile.role !== "admin") {
    return {
      ok: false as const,
      reason: "staff_only" as const,
      error: prReviewErrorMessage("staff_only"),
    };
  }

  const result = await createReviewRequest({
    prUrl,
    sourceType: "admin_curated",
    submittedByUserId: gate.profile.id,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  revalidatePrReviewPaths();
  return { ok: true as const, id: result.id };
}

export async function listAllReviewRequestsAction() {
  const gate = await requirePrReviewActor();
  if (!gate.ok || gate.profile.role !== "admin") {
    return { ok: false as const, requests: [] };
  }

  const requests = await listAllReviewRequests();
  return { ok: true as const, requests };
}

export async function hideReviewRequestAction(id: string, reason: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  if (gate.profile.role !== "admin") {
    return {
      ok: false as const,
      reason: "staff_only" as const,
      error: prReviewErrorMessage("staff_only"),
    };
  }

  const result = await hideReviewRequest({ id, reason });
  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  await recordAdminAction({
    actorUserId: gate.profile.id,
    action: "hide_pr_review_request",
    metadata: { id, reason },
  });

  revalidatePrReviewPaths();
  return { ok: true as const };
}

export async function unhideReviewRequestAction(id: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  if (gate.profile.role !== "admin") {
    return {
      ok: false as const,
      reason: "staff_only" as const,
      error: prReviewErrorMessage("staff_only"),
    };
  }

  const result = await unhideReviewRequest(id);
  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  await recordAdminAction({
    actorUserId: gate.profile.id,
    action: "unhide_pr_review_request",
    metadata: { id },
  });

  revalidatePrReviewPaths();
  return { ok: true as const };
}

export async function listMySubmissionsAction() {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return { ok: false as const, requests: [] };
  }

  const requests = await listMySubmissions(gate.profile.id);
  return { ok: true as const, requests };
}

export async function listMyReviewsAction() {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return { ok: false as const, requests: [] };
  }

  const requests = await listMyReviewedRequests(gate.profile.id);
  return { ok: true as const, requests };
}

export async function withdrawReviewRequestAction(id: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  const result = await withdrawOwnReviewRequest({ id, userId: gate.profile.id });
  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  revalidatePrReviewPaths();
  return { ok: true as const };
}

export async function reportOwnReviewAction(id: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  const result = await reportOwnReview({ id, userId: gate.profile.id });
  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  revalidatePrReviewPaths();
  return { ok: true as const };
}

export async function restoreReviewRequestAction(id: string) {
  const gate = await requirePrReviewActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: prReviewErrorMessage(gate.reason),
    };
  }

  const result = await restoreOwnReviewRequest({ id, userId: gate.profile.id });
  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: prReviewErrorMessage(result.reason),
    };
  }

  revalidatePrReviewPaths();
  return { ok: true as const };
}
