export type AchievementCategory =
  | "learning"
  | "projects"
  | "open-source"
  | "milestones";

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
  | { type: "submissions_approved"; min: number };

export type AchievementEvalContext = {
  progressByRoadmap: Record<string, string[]>;
  approvedSubmissionCount: number;
};
