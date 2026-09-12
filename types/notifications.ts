export type EmailNotificationPrefs = {
  reviewOutcomes: boolean;
  reviewQueue: boolean;
  achievements: boolean;
  product: boolean;
  qaActivity: boolean;
  prReviewActivity: boolean;
};

export const DEFAULT_EMAIL_NOTIFICATION_PREFS: EmailNotificationPrefs = {
  reviewOutcomes: false,
  reviewQueue: false,
  achievements: true,
  product: false,
  qaActivity: false,
  prReviewActivity: false,
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
    qaActivity:
      typeof raw.qaActivity === "boolean"
        ? raw.qaActivity
        : DEFAULT_EMAIL_NOTIFICATION_PREFS.qaActivity,
    prReviewActivity:
      typeof raw.prReviewActivity === "boolean"
        ? raw.prReviewActivity
        : DEFAULT_EMAIL_NOTIFICATION_PREFS.prReviewActivity,
  };
}
