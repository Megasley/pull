export type NavItem = {
  title: string;
  href: string;
};

export type RoadmapNodeStatus = "default" | "active" | "completed" | "locked";

export type RoadmapDifficulty = "beginner" | "intermediate" | "advanced";

export type RoadmapNodeData = {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  difficulty?: RoadmapDifficulty;
  status?: RoadmapNodeStatus;
};
