import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements/definitions";
import { sendEmail } from "@/lib/email/send";
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

  await sendEmail({
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

  await Promise.all(
    recipients.map((recipient) =>
      sendEmail({
        to: recipient.email,
        subject: `Review queue: ${input.projectTitle}`,
        react: ReviewQueueEmail({
          displayName: recipient.displayName,
          projectTitle: input.projectTitle,
          submitterUsername: input.submitterUsername,
          href: appUrl(`/review/${input.submissionId}`),
        }),
      }),
    ),
  );
}

export function notifyReviewQueueAsync(
  input: Parameters<typeof notifyReviewQueue>[0],
) {
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
    .filter((item): item is (typeof ACHIEVEMENT_DEFINITIONS)[number] =>
      Boolean(item),
    )
    .map((item) => ({ title: item.title, xpReward: item.xpReward }));

  if (achievements.length === 0) {
    return;
  }

  await sendEmail({
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

  await sendEmail({
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

  await sendEmail({
    to: recipient.email,
    subject:
      input.role === "admin"
        ? "You're an admin on Pull"
        : "You're a reviewer on Pull",
    react: RoleGrantedEmail({
      displayName: recipient.displayName,
      role: input.role,
      href: appUrl(input.role === "admin" ? "/admin" : "/review"),
    }),
  });
}

export function notifyRoleGrantedAsync(
  input: Parameters<typeof notifyRoleGranted>[0],
) {
  fireAndForget(notifyRoleGranted(input), "role-granted");
}
