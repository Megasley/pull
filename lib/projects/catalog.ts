import catalogJson from "@/content/projects/catalog.json";
import type {
  PaginatedProjects,
  ProjectCatalogFile,
  ProjectCatalogItem,
  ProjectCategory,
  ProjectFilters,
} from "@/types/project";
import { PROJECT_CATEGORIES } from "@/types/project";
import type { RoadmapDifficulty } from "@/types";

const catalog = catalogJson as ProjectCatalogFile;

export const PROJECT_PAGE_SIZE = 9;

const DIFFICULTY_RANK: Record<RoadmapDifficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export function getAllProjects(): ProjectCatalogItem[] {
  return [...catalog.projects].sort((a, b) => {
    const rank = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
    if (rank !== 0) return rank;
    return a.title.localeCompare(b.title);
  });
}

export function getProjectBySlug(slug: string): ProjectCatalogItem | undefined {
  return catalog.projects.find((project) => project.slug === slug);
}

export function getProjectCategories(): readonly ProjectCategory[] {
  return PROJECT_CATEGORIES;
}

export function filterProjects(
  projects: ProjectCatalogItem[],
  filters: ProjectFilters = {},
): ProjectCatalogItem[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const category = filters.category ?? "all";
  const difficulty = filters.difficulty ?? "all";

  return projects.filter((project) => {
    if (category !== "all" && !project.categories.includes(category)) {
      return false;
    }

    if (difficulty !== "all" && project.difficulty !== difficulty) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      project.title,
      project.description,
      ...project.categories,
      ...project.requiredSkills,
      ...project.prerequisites,
      project.roadmapSlug,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function paginateProjects(
  projects: ProjectCatalogItem[],
  page = 1,
  pageSize = PROJECT_PAGE_SIZE,
): PaginatedProjects {
  const total = projects.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: projects.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function listFilteredProjects(
  filters: ProjectFilters = {},
  page = 1,
  pageSize = PROJECT_PAGE_SIZE,
): PaginatedProjects {
  return paginateProjects(filterProjects(getAllProjects(), filters), page, pageSize);
}

export const DIFFICULTY_OPTIONS: Array<RoadmapDifficulty | "all"> = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
];
