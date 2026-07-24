import type { RoadmapDifficulty } from "@/types";

export type RepositoryHealth = "excellent" | "good" | "fair";
export type RepositorySize = "small" | "medium" | "large";
export type DiscoveryTrack = "bitcoin" | "lightning";

export type DiscoveryRepository = {
  id: string;
  name: string;
  repository: string;
  description: string;
  url: string;
  issuesUrl: string;
  maintainer: string;
  language: string;
  topics: string[];
  labels: string[];
  difficulty: RoadmapDifficulty;
  estimatedDifficulty: string;
  goodFirstIssues: number;
  helpWanted: number;
  averageReviewDays: number;
  health: RepositoryHealth;
  size: RepositorySize;
  tracks: DiscoveryTrack[];
  recommendedLanguages: string[];
  minLevel: number;
};

export type DiscoveryFilters = {
  query: string;
  language: string | "all";
  topic: string | "all";
  difficulty: RoadmapDifficulty | "all";
  size: RepositorySize | "all";
  bookmarkedOnly?: boolean;
};

export type DiscoveryRecommendation = {
  repository: DiscoveryRepository;
  score: number;
  reasons: string[];
};

export type DiscoveryProfileContext = {
  completedRoadmapSlugs: string[];
  languages: string[];
  level: number;
};
