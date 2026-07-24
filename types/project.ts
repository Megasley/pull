import type { RoadmapDifficulty } from "@/types";

export const PROJECT_CATEGORIES = [
  "Bitcoin",
  "Lightning",
  "Wallets",
  "Infrastructure",
  "Open Source",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectCatalogItem = {
  slug: string;
  title: string;
  description: string;
  difficulty: RoadmapDifficulty;
  estimatedTime: string;
  categories: ProjectCategory[];
  requiredSkills: string[];
  roadmapSlug: string;
  lessonSlug: string;
  prerequisites: string[];
  /** Stubbed until submissions exist - 0-100 */
  completionRate: number;
};

export type ProjectCatalogFile = {
  projects: ProjectCatalogItem[];
};

export type ProjectFilters = {
  query?: string;
  category?: ProjectCategory | "all";
  difficulty?: RoadmapDifficulty | "all";
};

export type PaginatedProjects = {
  items: ProjectCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProjectResource = {
  title: string;
  url?: string;
};

export type ProjectExampleRepo = {
  title: string;
  url: string;
  description?: string;
};

export type ProjectSpecFrontmatter = {
  objectives: string[];
  architecture: string;
  requirements: string[];
  stretchGoals: string[];
  resources: ProjectResource[];
  exampleRepos: ProjectExampleRepo[];
  submission: string[];
};

export type ProjectSpec = ProjectCatalogItem &
  ProjectSpecFrontmatter & {
    overview: string;
  };
