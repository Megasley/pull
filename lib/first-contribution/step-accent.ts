export type FirstContributionAccent = "blue" | "violet" | "pink" | "orange" | "teal";

type AccentStyle = {
  /** Border + soft fill + text — the step icon badge in the journey list
   *  and the "Step X of Y" tag on the step page itself. */
  badge: string;
  /** Border only, no fill — a colored accent on the step's "Try it" card. */
  border: string;
};

/**
 * One accent per step, cycling through this 5-color set across the 10-step
 * journey (see lib/first-contribution/steps.ts) — purely decorative variety
 * so the guide doesn't read as one flat monochrome block. Distinct from the
 * semantic colors elsewhere in the journey (signal green for "complete",
 * ink for "next up" in journey-overview.tsx), which still take visual
 * priority over these — an accent never overrides what a step's actual
 * completion state looks like.
 */
export const ACCENT_STYLES: Record<FirstContributionAccent, AccentStyle> = {
  blue: {
    badge: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  violet: {
    badge: "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    border: "border-violet-500/30",
  },
  pink: {
    badge: "border-pink-500/40 bg-pink-500/10 text-pink-600 dark:text-pink-400",
    border: "border-pink-500/30",
  },
  orange: {
    badge: "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
  },
  teal: {
    badge: "border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
  },
};
