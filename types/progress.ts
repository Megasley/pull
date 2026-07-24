export type RoadmapProgressSummary = {
  roadmapSlug: string;
  title: string;
  description: string;
  completed: number;
  total: number;
  percentage: number;
  resumeLessonSlug: string | null;
  resumeLessonTitle: string | null;
  completedProjects: Array<{
    slug: string;
    title: string;
    project: string;
  }>;
};

export type UserProgressState = {
  roadmapSlug: string;
  completedNodeSlugs: string[];
};
