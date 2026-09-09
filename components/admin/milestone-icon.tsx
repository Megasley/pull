import type { ComponentType, SVGProps } from "react";
import { Compass, Flag, GitMerge, GitPullRequest, GraduationCap, Send } from "lucide-react";

import type { MilestoneType } from "@/lib/milestones/types";

export const MILESTONE_ICONS: Record<
  MilestoneType,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  first_opportunity_explored: Compass,
  first_pr_opened: GitPullRequest,
  first_pr_submitted: Send,
  first_pr_merged: GitMerge,
  first_verified_contribution: GitMerge,
  // GraduationCap distinguishes practice-repo activity from real contributor
  // activity at a glance in the admin feed — see lib/first-contribution/.
  practice_first_pr_opened: GraduationCap,
  practice_first_pr_submitted: GraduationCap,
  practice_first_pr_merged: GraduationCap,
  first_contribution_started: GraduationCap,
  first_contribution_completed: Flag,
};

export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  first_opportunity_explored: "First opportunity explored",
  first_pr_opened: "First PR opened",
  first_pr_submitted: "First PR submitted",
  first_pr_merged: "First PR merged",
  first_verified_contribution: "Verified contribution",
  practice_first_pr_opened: "First Contribution: PR opened",
  practice_first_pr_submitted: "First Contribution: PR submitted",
  practice_first_pr_merged: "First Contribution: PR merged",
  first_contribution_started: "First Contribution: started",
  first_contribution_completed: "First Contribution: completed",
};
