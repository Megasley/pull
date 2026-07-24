export type EmailNotificationPrefs = {
  reviewOutcomes: boolean;
  reviewQueue: boolean;
  achievements: boolean;
  product: boolean;
};

export const DEFAULT_EMAIL_NOTIFICATION_PREFS: EmailNotificationPrefs = {
  reviewOutcomes: true,
  reviewQueue: true,
  achievements: true,
  product: true,
};

export type EmailNotificationPrefKey = keyof EmailNotificationPrefs;

export function normalizeEmailNotificationPrefs(
  value: unknown,
): EmailNotificationPrefs {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_EMAIL_NOTIFICATION_PREFS };
  }

  const raw = value as Record<string, unknown>;
  return {
    reviewOutcomes:
      typeof raw.reviewOutcomes === "boolean"
        ? raw.reviewOutcomes
        : DEFAULT_EMAIL_NOTIFICATION_PREFS.reviewOutcomes,
    reviewQueue:
      typeof raw.reviewQueue === "boolean"
        ? raw.reviewQueue
        : DEFAULT_EMAIL_NOTIFICATION_PREFS.reviewQueue,
    achievements:
      typeof raw.achievements === "boolean"
        ? raw.achievements
        : DEFAULT_EMAIL_NOTIFICATION_PREFS.achievements,
    product:
      typeof raw.product === "boolean"
        ? raw.product
        : DEFAULT_EMAIL_NOTIFICATION_PREFS.product,
  };
}
