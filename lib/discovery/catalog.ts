import catalog from "@/content/discovery/repositories.json";
import type { RoadmapDifficulty } from "@/types";
import type {
  DiscoveryFilters,
  DiscoveryProfileContext,
  DiscoveryRecommendation,
  DiscoveryRepository,
  RepositorySize,
} from "@/types/discovery";

export const DISCOVERY_PAGE_SIZE = 9;

export const DISCOVERY_DIFFICULTY_OPTIONS: Array<RoadmapDifficulty | "all"> = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
];

export const DISCOVERY_SIZE_OPTIONS: Array<RepositorySize | "all"> = [
  "all",
  "small",
  "medium",
  "large",
];

const repositories = catalog as DiscoveryRepository[];

export function getAllDiscoveryRepositories(): DiscoveryRepository[] {
  return repositories;
}

export function getDiscoveryRepositoryById(
  id: string,
): DiscoveryRepository | null {
  return repositories.find((item) => item.id === id) ?? null;
}

export function getDiscoveryLanguages(): string[] {
  return [...new Set(repositories.map((item) => item.language))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getDiscoveryTopics(): string[] {
  const topics = new Set<string>();
  for (const repo of repositories) {
    for (const topic of repo.topics) topics.add(topic);
  }
  return [...topics].sort((a, b) => a.localeCompare(b));
}

export function filterDiscoveryRepositories(
  items: DiscoveryRepository[],
  filters: DiscoveryFilters,
  bookmarkedIds: string[] = [],
): DiscoveryRepository[] {
  const query = filters.query.trim().toLowerCase();
  const bookmarked = new Set(bookmarkedIds);

  return items.filter((repo) => {
    if (filters.bookmarkedOnly && !bookmarked.has(repo.id)) return false;
    if (filters.language !== "all" && repo.language !== filters.language) {
      return false;
    }
    if (filters.topic !== "all" && !repo.topics.includes(filters.topic)) {
      return false;
    }
    if (filters.difficulty !== "all" && repo.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.size !== "all" && repo.size !== filters.size) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      repo.name,
      repo.repository,
      repo.description,
      repo.maintainer,
      repo.language,
      repo.estimatedDifficulty,
      ...repo.topics,
      ...repo.labels,
      ...repo.tracks,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function paginateDiscoveryRepositories<T>(
  items: T[],
  page: number,
  pageSize = DISCOVERY_PAGE_SIZE,
) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export function recommendDiscoveryRepositories(
  context: DiscoveryProfileContext,
  limit = 4,
): DiscoveryRecommendation[] {
  const languageSet = new Set(
    context.languages.map((item) => item.toLowerCase()),
  );
  const completed = new Set(context.completedRoadmapSlugs);

  const scored = repositories.map((repository) => {
    const reasons: string[] = [];
    let score = 0;

    for (const track of repository.tracks) {
      if (completed.has(track)) {
        score += 35;
        reasons.push(`Matches your completed ${track} roadmap`);
      }
    }

    const languageHits = repository.recommendedLanguages.filter((lang) =>
      languageSet.has(lang.toLowerCase()),
    );
    if (languageHits.length > 0) {
      score += 25 * languageHits.length;
      reasons.push(`Uses ${languageHits.join(", ")} from your GitHub activity`);
    }

    if (context.level >= repository.minLevel) {
      score += 15;
      reasons.push(`Fits builders around level ${repository.minLevel}+`);
    } else {
      score -= 10;
    }

    if (repository.difficulty === "beginner" && context.level <= 2) {
      score += 12;
      reasons.push("Beginner-friendly on-ramp");
    }

    if (repository.goodFirstIssues >= 8) {
      score += 10;
      reasons.push(`${repository.goodFirstIssues} good first issues listed`);
    }

    if (repository.health === "excellent") {
      score += 8;
      reasons.push("Strong repository health");
    }

    if (repository.averageReviewDays <= 5) {
      score += 6;
      reasons.push(`Typical review ~${repository.averageReviewDays}d`);
    }

    if (reasons.length === 0) {
      reasons.push("Curated Bitcoin / Lightning contribution target");
      score += 5;
    }

    return { repository, score, reasons: reasons.slice(0, 3) };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.repository.name.localeCompare(b.repository.name))
    .slice(0, limit);
}

/** Keep dashboard opportunity cards in sync with discovery catalog. */
export function getDiscoveryOpportunitiesForDashboard(limit = 4) {
  return recommendDiscoveryRepositories(
    {
      completedRoadmapSlugs: [],
      languages: [],
      level: 1,
    },
    limit,
  ).map((item) => ({
    id: item.repository.id,
    title: item.repository.name,
    repository: item.repository.repository,
    description: item.repository.description,
    url: item.repository.url,
    tags: [
      item.repository.language,
      item.repository.difficulty,
      ...item.repository.labels.slice(0, 1),
    ],
  }));
}
