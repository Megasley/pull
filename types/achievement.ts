export type AchievementCategory =
  "learning" | "projects" | "open-source" | "milestones";

export type AchievementIconKey =
  | "target"
  | "blocks"
  | "bitcoin"
  | "link"
  | "hammer"
  | "wallet"
  | "zap"
  | "unlock"
  | "globe"
  | "map"
  | "flag"
  | "git-pull-request"
  | "git-merge"
  | "send"
  | "shield-check";

export type AchievementCriteria =
  | { type: "lessons_completed"; min: number }
  | { type: "roadmap_progress"; roadmap: string; percent: number }
  | { type: "roadmap_complete"; roadmap: string }
  | { type: "any_roadmap_complete" }
  | { type: "any_project_node" }
  | { type: "project_slug_complete"; projectSlug: string }
  | { type: "nodes_complete"; roadmap: string; nodeIds: string[] }
  | { type: "nodes_complete_any"; roadmap: string; nodeIds: string[] }
  | { type: "roadmap_unlocked"; roadmap: string }
  | { type: "submissions_approved"; min: number }
  | { type: "github_pr_count"; min: number }
  | { type: "github_merged_pr_count"; min: number }
  | { type: "github_pr_ready_for_review_count"; min: number }
  | { type: "github_verified_merged_pr_count"; min: number };

export type AchievementEvalContext = {
  progressByRoadmap: Record<string, string[]>;
  approvedSubmissionCount: number;
  githubPrCount: number;
  githubMergedPrCount: number;
  githubPrReadyForReviewCount: number;
  githubVerifiedMergedPrCount: number;
};
