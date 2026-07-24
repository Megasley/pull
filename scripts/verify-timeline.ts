/**
 * Smoke checks for contribution timeline filters/ordering.
 * Run: npx tsx scripts/verify-timeline.ts
 */
import {
  filterTimelineEvents,
  groupTimelineByDay,
  sortTimelineEvents,
} from "../lib/timeline/filter";
import type { TimelineEvent } from "../types/timeline";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const events: TimelineEvent[] = [
  {
    id: "1",
    type: "commit",
    title: "Old commit",
    description: "repo",
    occurredAt: "2026-01-01T12:00:00.000Z",
    href: null,
  },
  {
    id: "2",
    type: "merged",
    title: "Merged PR",
    description: "repo",
    occurredAt: "2026-07-20T12:00:00.000Z",
    href: "https://github.com/acme/x/pull/1",
  },
  {
    id: "3",
    type: "project_submission",
    title: "Wallet UI",
    description: "submitted",
    occurredAt: "2026-07-21T08:00:00.000Z",
    href: "/projects/wallet/submit",
  },
  {
    id: "4",
    type: "roadmap_completion",
    title: "Bitcoin",
    description: "done",
    occurredAt: "2026-07-10T10:00:00.000Z",
    href: "/roadmaps/bitcoin",
  },
];

const sorted = sortTimelineEvents(events);
assert(sorted[0]?.id === "3", "newest first");
assert(sorted[1]?.id === "2", "second newest");

const now = Date.parse("2026-07-22T12:00:00.000Z");
const last7 = filterTimelineEvents(sorted, {
  types: "all",
  range: "7d",
  now,
});
assert(last7.length === 2, `expected 2 in 7d, got ${last7.length}`);

const mergedOnly = filterTimelineEvents(sorted, {
  types: ["merged"],
  range: "all",
  now,
});
assert(mergedOnly.length === 1 && mergedOnly[0]?.type === "merged", "type filter");

const empty = filterTimelineEvents(sorted, {
  types: ["review"],
  range: "7d",
  now,
});
assert(empty.length === 0, "empty filter state");

const groups = groupTimelineByDay(last7);
assert(groups.length === 2, "two day buckets");
assert(groups[0]!.key >= groups[1]!.key, "day groups newest first");

console.log("Contribution timeline checks passed.");
