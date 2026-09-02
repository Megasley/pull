import type { ComponentType, SVGProps } from "react";
import { Compass, GitMerge, GitPullRequest, Send } from "lucide-react";

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
};

export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  first_opportunity_explored: "First opportunity explored",
  first_pr_opened: "First PR opened",
  first_pr_submitted: "First PR submitted",
  first_pr_merged: "First PR merged",
  first_verified_contribution: "Verified contribution",
};
