"use server";

import { revalidatePath } from "next/cache";

import { recordAdminAction } from "@/lib/admin/audit-log";
import { requireActiveAccount } from "@/lib/auth/require-active-account";
import { isAdminRole } from "@/lib/auth/roles";
import {
  approveIssueSubmission,
  createIssueSubmission,
  listAllIssueSubmissions,
  listMyIssueSubmissions,
  previewIssueSubmission,
  rejectIssueSubmission,
  type ApproveIssueInput,
} from "@/lib/issues/submissions";
import { notifyIssueSubmittedAsync } from "@/lib/notifications/dispatch";

function issueSubmissionErrorMessage(reason: string) {
  switch (reason) {
    case "invalid_url":
      return "That doesn't look like a GitHub issue URL (https://github.com/owner/repo/issues/123).";
    case "not_found":
      return "Couldn't find that issue on GitHub. Check the URL and that the repository is public.";
    case "is_pull_request":
      return "That's a pull request, not an issue. To get a PR reviewed, use PR Reviews.";
    case "issue_closed":
      return "That issue is already closed on GitHub.";
    case "already_listed":
      return "That issue is already in Pull's recommendations.";
    case "already_submitted":
      return "Someone already submitted that issue.";
    case "rate_limited":
      return "You've submitted a lot of issues in the last hour. Try again later.";
    case "check_failed":
      return "Couldn't check GitHub right now. Try again in a moment.";
    case "invalid":
      return "Some fields are invalid. Check the category, difficulty, hours, and summary.";
    case "staff_only":
      return "Only admins can do that.";
    case "suspended":
      return "Your account is suspended. This is disabled until an admin restores access.";
    case "banned":
      return "Your account has been banned.";
    default:
      return "Sign in to continue.";
  }
}

function fail(reason: string) {
  return { ok: false as const, reason, error: issueSubmissionErrorMessage(reason) };
}

async function requireAdmin() {
  const gate = await requireActiveAccount();
  if (!gate.ok) return { ok: false as const, reason: gate.reason };
  if (!isAdminRole(gate.profile.role)) return { ok: false as const, reason: "staff_only" };
  return { ok: true as const, profile: gate.profile };
}

export async function previewIssueSubmissionAction(issueUrl: string) {
  const gate = await requireActiveAccount();
  if (!gate.ok) return fail(gate.reason);

  const result = await previewIssueSubmission({ issueUrl, userId: gate.profile.id });
  if (!result.ok) return fail(result.reason);
  return { ok: true as const, preview: result.preview };
}

export async function submitIssueAction(issueUrl: string) {
  const gate = await requireActiveAccount();
  if (!gate.ok) return fail(gate.reason);

  const result = await createIssueSubmission({ issueUrl, userId: gate.profile.id });
  if (!result.ok) return fail(result.reason);

  notifyIssueSubmittedAsync({
    submitterUsername: gate.profile.username,
    repoFullName: result.preview.repoFullName,
    issueNumber: result.preview.number,
    issueTitle: result.preview.title,
    issueUrl: result.preview.issueUrl,
  });

  revalidatePath("/issues/submit");
  revalidatePath("/admin/issues");
  return { ok: true as const, id: result.id };
}

export async function listMyIssueSubmissionsAction() {
  const gate = await requireActiveAccount();
  if (!gate.ok) return { ok: false as const, submissions: [] };
  return { ok: true as const, submissions: await listMyIssueSubmissions(gate.profile.id) };
}

export async function listAllIssueSubmissionsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, submissions: [] };
  return { ok: true as const, submissions: await listAllIssueSubmissions() };
}

export async function approveIssueSubmissionAction(
  input: Omit<ApproveIssueInput, "moderatorUserId">,
) {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.reason);

  const result = await approveIssueSubmission({ ...input, moderatorUserId: gate.profile.id });
  if (!result.ok) return fail(result.reason);

  await recordAdminAction({
    actorUserId: gate.profile.id,
    action: "approve_issue_submission",
    metadata: { id: input.id },
  });

  revalidatePath("/admin/issues");
  revalidatePath("/issues");
  return { ok: true as const };
}

export async function rejectIssueSubmissionAction(id: string, reason: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.reason);

  const result = await rejectIssueSubmission({ id, reason, moderatorUserId: gate.profile.id });
  if (!result.ok) return fail(result.reason);

  await recordAdminAction({
    actorUserId: gate.profile.id,
    action: "reject_issue_submission",
    metadata: { id, reason },
  });

  revalidatePath("/admin/issues");
  revalidatePath("/issues");
  return { ok: true as const };
}
