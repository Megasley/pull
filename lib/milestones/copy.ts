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
  practice_first_pr_opened: (name) =>
    `${name} opened their first pull request in the First Contribution practice repository.`,
  practice_first_pr_submitted: (name) =>
    `${name} submitted their First Contribution practice pull request for review.`,
  practice_first_pr_merged: (name) =>
    `${name} had their First Contribution practice pull request merged.`,
  first_contribution_started: (name) => `${name} started the First Contribution journey.`,
  first_contribution_completed: (name) =>
    `${name} completed the First Contribution journey.`,
};

export const MILESTONE_TITLES: Record<MilestoneType, string> = {
  first_opportunity_explored: "First opportunity explored",
  first_pr_opened: "First PR opened",
  first_pr_submitted: "PR submitted",
  first_pr_merged: "First PR merged",
  first_verified_contribution: "Verified contribution",
  practice_first_pr_opened: "First Contribution: PR opened",
  practice_first_pr_submitted: "First Contribution: PR submitted",
  practice_first_pr_merged: "First Contribution: PR merged",
  first_contribution_started: "First Contribution: started",
  first_contribution_completed: "First Contribution: completed",
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
