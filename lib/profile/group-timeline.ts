import type { TimelineEvent } from "@/types/timeline";

export type GroupedTimelineEvent = TimelineEvent & {
  groupCount?: number;
};

/**
 * Collapse consecutive commits with the same title + repo description
 * (matches pull_profile_redesign.html timeline grouping).
 */
export function groupTimelineEvents(events: TimelineEvent[]): GroupedTimelineEvent[] {
  const grouped: GroupedTimelineEvent[] = [];

  for (const event of events) {
    const previous = grouped[grouped.length - 1];

    if (
      previous &&
      event.type === "commit" &&
      previous.type === "commit" &&
      event.title === previous.title &&
      event.description === previous.description
    ) {
      previous.groupCount = (previous.groupCount ?? 1) + 1;
      continue;
    }

    grouped.push({ ...event, groupCount: 1 });
  }

  return grouped;
}
