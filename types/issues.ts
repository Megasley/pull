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
  /** Set on builder-submitted issues (lib/issues/submissions.ts), which can
   *  come from repos outside the Discover catalog — `repoId` then won't
   *  resolve, and this is used for the card's repo name/link instead. */
  repositoryFullName?: string;
  /** Pull username of the builder who suggested it, for submitted issues. */
  submittedByUsername?: string | null;
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
  /** Curated issues closed or deleted on GitHub — never recommended. */
  unavailableIssueIds?: string[];
  /** Admin-approved, still-open builder submissions, ranked alongside the
   *  static catalog. */
  submittedIssues?: CuratedIssue[];
};

export type IssueRecommendation = {
  issue: CuratedIssue;
  repositoryName: string;
  repositoryFullName: string;
  repositoryUrl: string;
  score: number;
  reasons: string[];
};
