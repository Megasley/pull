export type TimelineEventType =
  | "commit"
  | "pull_request"
  | "issue"
  | "review"
  | "merged"
  | "project_submission"
  | "roadmap_completion";

export type TimelineDateRange = "7d" | "30d" | "90d" | "365d" | "all";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
  meta?: string | null;
};

export type TimelineBucket = {
  key: string;
  label: string;
  events: TimelineEvent[];
};

export type ContributionTimelineData = {
  events: TimelineEvent[];
  totals: Record<TimelineEventType, number>;
};
