import type {
  TimelineDateRange,
  TimelineEvent,
  TimelineEventType,
} from "@/types/timeline";

export const TIMELINE_EVENT_TYPES: TimelineEventType[] = [
  "commit",
  "pull_request",
  "issue",
  "review",
  "merged",
  "project_submission",
  "roadmap_completion",
];

export const TIMELINE_TYPE_LABEL: Record<TimelineEventType, string> = {
  commit: "Commits",
  pull_request: "Pull requests",
  issue: "Issues",
  review: "Reviews",
  merged: "Merged",
  project_submission: "Submissions",
  roadmap_completion: "Roadmaps",
};

export const TIMELINE_TYPE_SINGULAR: Record<TimelineEventType, string> = {
  commit: "Commit",
  pull_request: "Pull request",
  issue: "Issue",
  review: "Review",
  merged: "Merged",
  project_submission: "Submission",
  roadmap_completion: "Roadmap",
};

export const TIMELINE_DATE_RANGES: Array<{
  value: TimelineDateRange;
  label: string;
}> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "365d", label: "1 year" },
  { value: "all", label: "All time" },
];

const RANGE_DAYS: Record<Exclude<TimelineDateRange, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

export function dateRangeStart(
  range: TimelineDateRange,
  now = Date.now(),
): number | null {
  if (range === "all") return null;
  return now - RANGE_DAYS[range] * 24 * 60 * 60 * 1000;
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  options: {
    types: TimelineEventType[] | "all";
    range: TimelineDateRange;
    now?: number;
  },
): TimelineEvent[] {
  const start = dateRangeStart(options.range, options.now);

  return events.filter((event) => {
    if (options.types !== "all" && !options.types.includes(event.type)) {
      return false;
    }

    if (start === null) return true;
    const time = Date.parse(event.occurredAt);
    if (!Number.isFinite(time)) return false;
    return time >= start;
  });
}

export function sortTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const aTime = Date.parse(a.occurredAt) || 0;
    const bTime = Date.parse(b.occurredAt) || 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.id.localeCompare(b.id);
  });
}

export function groupTimelineByDay(events: TimelineEvent[]): Array<{
  key: string;
  label: string;
  events: TimelineEvent[];
}> {
  const groups = new Map<string, TimelineEvent[]>();

  for (const event of events) {
    const time = Date.parse(event.occurredAt);
    const key = Number.isFinite(time)
      ? new Date(time).toISOString().slice(0, 10)
      : "unknown";
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, dayEvents]) => ({
      key,
      label: formatDayLabel(key),
      events: dayEvents,
    }));
}

function formatDayLabel(key: string): string {
  if (key === "unknown") return "Unknown date";
  const date = new Date(`${key}T12:00:00.000Z`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function countByType(
  events: TimelineEvent[],
): Record<TimelineEventType, number> {
  const totals = Object.fromEntries(
    TIMELINE_EVENT_TYPES.map((type) => [type, 0]),
  ) as Record<TimelineEventType, number>;

  for (const event of events) {
    totals[event.type] += 1;
  }

  return totals;
}
