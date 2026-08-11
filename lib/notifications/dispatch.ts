import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements/definitions";
import { sendEmail, type SendEmailInput, type SendEmailResult } from "@/lib/email/send";
import { AchievementEmail } from "@/lib/email/templates/achievement";
import { ReviewOutcomeEmail } from "@/lib/email/templates/review-outcome";
import { ReviewQueueEmail } from "@/lib/email/templates/review-queue";
import { RoleGrantedEmail } from "@/lib/email/templates/role-granted";
import { WelcomeEmail } from "@/lib/email/templates/welcome";
import {
  getNotificationRecipient,
  listReviewQueueRecipients,
  recipientAllows,
} from "@/lib/notifications/recipients";
import { getSiteUrl } from "@/lib/supabase/env";
import type { UserRole } from "@/types/submission";

function appUrl(path: string) {
  const base = getSiteUrl() || "https://pullos.dev";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function fireAndForget(task: Promise<unknown>, label: string) {
  void task.catch((error) => {
    console.error(`[notifications] ${label} failed:`, error);
  });
}

const EMAIL_BATCH_SIZE = 5;
const EMAIL_BATCH_DELAY_MS = 400;
const EMAIL_MAX_RETRIES = 3;
const EMAIL_RETRY_BASE_MS = 750;

function isRetriableSendFailure(result: SendEmailResult): boolean {
  if (result.ok) return false;
  if (result.reason === "not_configured") return false;

  const err = result.error as
    | { statusCode?: number; status?: number }
    | null
    | undefined;

  const status = err?.statusCode ?? err?.status;
  if (typeof status === "number") {
    if (status === 429 || status >= 500) return true;
  }

  const msg = err && typeof err === "object" && "message" in err
    ? String((err as { message?: unknown }).message ?? "")
    : "";

  return /rate.?limit|too many requests|timeout|socket|econn|5\d\d/i.test(msg);
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function sendEmailWithRetry(
  input: SendEmailInput,
  opts: { maxRetries?: number; baseDelayMs?: number } = {},
): Promise<SendEmailResult> {
  const maxRetries = opts.maxRetries ?? EMAIL_MAX_RETRIES;
  const baseDelay = opts.baseDelayMs ?? EMAIL_RETRY_BASE_MS;

  let last: SendEmailResult | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const result = await sendEmail(input);
    last = result;
    if (result.ok) return result;
    if (!isRetriableSendFailure(result)) return result;
    if (attempt < maxRetries) {
      const backoff = baseDelay * 2 ** attempt + Math.round(Math.random() * baseDelay);
      await delay(backoff);
    }
  }
  return last as SendEmailResult;
}

async function sendEmailInBatches(
  items: SendEmailInput[],
  opts: { batchSize?: number; delayMs?: number } = {},
): Promise<{
  sent: number;
  failed: number;
  failures: Array<{ to: string; reason: string }>;
}> {
  const batchSize = opts.batchSize ?? EMAIL_BATCH_SIZE;
  const delayMs = opts.delayMs ?? EMAIL_BATCH_DELAY_MS;
  const failures: Array<{ to: string; reason: string }> = [];
  let sent = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (item) => ({ to: item.to, result: await sendEmailWithRetry(item) })),
    );

    for (const { to, result } of results) {
      if (result.ok) {
        sent += 1;
      } else {
        failures.push({ to, reason: result.reason });
      }
    }

    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }

  return { sent, failed: failures.length, failures };
}

export async function notifyReviewOutcome(input: {
  userId: string;
  projectSlug: string;
  projectTitle: string;
  outcome: "approved" | "changes_requested" | "rejected";
  comment?: string;
}) {
  const recipient = await getNotificationRecipient(input.userId);
  if (!recipient || !recipientAllows(recipient, "reviewOutcomes")) {
    return;
  }

  const href =
    input.outcome === "approved"
      ? appUrl(`/projects/${input.projectSlug}`)
      : appUrl(`/projects/${input.projectSlug}/submit`);

  await sendEmailWithRetry({
    to: recipient.email,
    subject:
      input.outcome === "approved"
        ? `Approved: ${input.projectTitle}`
        : input.outcome === "changes_requested"
          ? `Changes requested: ${input.projectTitle}`
          : `Rejected: ${input.projectTitle}`,
    react: ReviewOutcomeEmail({
      displayName: recipient.displayName,
      projectTitle: input.projectTitle,
      outcome: input.outcome,
      comment: input.comment,
      href,
    }),
  });
}

export function notifyReviewOutcomeAsync(
  input: Parameters<typeof notifyReviewOutcome>[0],
) {
  fireAndForget(notifyReviewOutcome(input), "review-outcome");
}

export async function notifyReviewQueue(input: {
  submissionId: string;
  submitterUserId: string;
  submitterUsername: string;
  projectTitle: string;
}) {
  const recipients = await listReviewQueueRecipients(input.submitterUserId);

  const payloads: SendEmailInput[] = recipients.map((recipient) => ({
    to: recipient.email,
    subject: `Review queue: ${input.projectTitle}`,
    react: ReviewQueueEmail({
      displayName: recipient.displayName,
      projectTitle: input.projectTitle,
      submitterUsername: input.submitterUsername,
      href: appUrl(`/review/${input.submissionId}`),
    }),
  }));

  const stats = await sendEmailInBatches(payloads);

  if (stats.failed > 0) {
    console.warn("[notifications] review-queue partial failures", {
      submissionId: input.submissionId,
      total: payloads.length,
      sent: stats.sent,
      failed: stats.failed,
      failures: stats.failures,
    });
  }
}

export function notifyReviewQueueAsync(input: Parameters<typeof notifyReviewQueue>[0]) {
  fireAndForget(notifyReviewQueue(input), "review-queue");
}

export async function notifyAchievementsUnlocked(input: {
  userId: string;
  slugs: string[];
}) {
  if (input.slugs.length === 0) {
    return;
  }

  const recipient = await getNotificationRecipient(input.userId);
  if (!recipient || !recipientAllows(recipient, "achievements")) {
    return;
  }

  const achievements = input.slugs
    .map((slug) => ACHIEVEMENT_DEFINITIONS.find((item) => item.id === slug))
    .filter((item): item is (typeof ACHIEVEMENT_DEFINITIONS)[number] => Boolean(item))
    .map((item) => ({ title: item.title, xpReward: item.xpReward }));

  if (achievements.length === 0) {
    return;
  }

  await sendEmailWithRetry({
    to: recipient.email,
    subject:
      achievements.length === 1
        ? `Achievement unlocked: ${achievements[0].title}`
        : `${achievements.length} achievements unlocked`,
    react: AchievementEmail({
      displayName: recipient.displayName,
      achievements,
      href: appUrl("/achievements"),
    }),
  });
}

export function notifyAchievementsUnlockedAsync(
  input: Parameters<typeof notifyAchievementsUnlocked>[0],
) {
  fireAndForget(notifyAchievementsUnlocked(input), "achievements");
}

export async function notifyWelcome(input: {
  userId: string;
  displayName: string;
  email: string | null | undefined;
}) {
  const email = input.email?.trim();
  if (!email) {
    return;
  }

  const recipient = await getNotificationRecipient(input.userId);
  if (recipient && !recipientAllows(recipient, "product")) {
    return;
  }

  await sendEmailWithRetry({
    to: email,
    subject: "Welcome to Pull",
    react: WelcomeEmail({
      displayName: input.displayName,
      href: appUrl("/dashboard"),
    }),
  });
}

export function notifyWelcomeAsync(input: Parameters<typeof notifyWelcome>[0]) {
  fireAndForget(notifyWelcome(input), "welcome");
}

export async function notifyRoleGranted(input: {
  userId: string;
  role: Extract<UserRole, "reviewer" | "admin">;
}) {
  const recipient = await getNotificationRecipient(input.userId);
  if (!recipient || !recipientAllows(recipient, "product")) {
    return;
  }

  await sendEmailWithRetry({
    to: recipient.email,
    subject:
      input.role === "admin" ? "You're an admin on Pull" : "You're a reviewer on Pull",
    react: RoleGrantedEmail({
      displayName: recipient.displayName,
      role: input.role,
      href: appUrl(input.role === "admin" ? "/admin" : "/review"),
    }),
  });
}

export function notifyRoleGrantedAsync(input: Parameters<typeof notifyRoleGranted>[0]) {
  fireAndForget(notifyRoleGranted(input), "role-granted");
}
