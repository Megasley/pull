import type { MilestoneType } from "./types";

export type MilestoneCopy = {
  /** Short label for the notification list / activity feed. */
  title: string;
  /** Full sentence, e.g. "Kingsley just opened their first tracked pull request." */
  description: string;
};

const DESCRIPTIONS: Record<MilestoneType, (displayName: string) => string> = {
  first_opportunity_explored: (name) => `${name} explored their first opportunity on Pull.`,
  first_pr_opened: (name) => `${name} just opened their first tracked pull request.`,
  first_pr_submitted: (name) => `${name} submitted their first pull request for review.`,
  first_pr_merged: (name) => `${name} just had their first tracked pull request merged.`,
  first_verified_contribution: (name) =>
    `${name} landed their first verified open source contribution.`,
};

export const MILESTONE_TITLES: Record<MilestoneType, string> = {
  first_opportunity_explored: "First opportunity explored",
  first_pr_opened: "First PR opened",
  first_pr_submitted: "PR submitted",
  first_pr_merged: "First PR merged",
  first_verified_contribution: "Verified contribution",
};

export function buildMilestoneCopy(
  milestoneType: MilestoneType,
  displayName: string,
): MilestoneCopy {
  return {
    title: MILESTONE_TITLES[milestoneType],
    description: DESCRIPTIONS[milestoneType](displayName),
  };
}
