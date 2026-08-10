import type { RoadmapDifficulty } from "@/types";
import type { DiscoveryTrack } from "@/types/discovery";

export type IssueCategory =
  "good_first_issue" | "help_wanted" | "documentation" | "bug_fix" | "feature_request";

export type CuratedIssue = {
  id: string;
  repoId: string;
  number: number;
  title: string;
  url: string;
  category: IssueCategory;
  labels: string[];
  difficulty: RoadmapDifficulty;
  language: string;
  tracks: DiscoveryTrack[];
  skills: string[];
  estimatedHours: number;
  summary: string;
};

export type IssueRecommendationContext = {
  completedRoadmapSlugs: string[];
  completedProjectSlugs: string[];
  languages: string[];
  level: number;
  /** Recent GitHub activity volume (commits + PRs + issues). */
  githubActivityCount: number;
  recommendedRepoIds: string[];
  savedIssueIds?: string[];
  dismissedIssueIds?: string[];
};

export type IssueRecommendation = {
  issue: CuratedIssue;
  repositoryName: string;
  repositoryFullName: string;
  repositoryUrl: string;
  score: number;
  reasons: string[];
};
