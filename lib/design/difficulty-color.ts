import type { RoadmapDifficulty } from "@/types";

/**
 * Shared traffic-light color for `RoadmapDifficulty` (beginner/intermediate/
 * advanced) — the same convention across every surface that shows it
 * (discovery repo cards, project cards/filters, developer tool cards,
 * roadmap cards): green reads as "easier to jump into" everywhere a
 * developer already expects it, so it needs no legend. Previously each
 * surface had its own copy of a flat ink/signal-only map; centralized here
 * so "what does beginner look like" answers the same way everywhere.
 */
export const DIFFICULTY_BADGE_CLASS: Record<RoadmapDifficulty, string> = {
  beginner: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  intermediate: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  advanced: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

/** Same palette, solid fill — for a small dot indicator rather than a full badge. */
export const DIFFICULTY_DOT_CLASS: Record<RoadmapDifficulty, string> = {
  beginner: "bg-emerald-500",
  intermediate: "bg-amber-500",
  advanced: "bg-rose-500",
};
