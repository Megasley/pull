import type { AchievementItem } from "@/types/dashboard";
import type { PublicBuilderProfile } from "@/types/user";
import type { RoadmapProgressSummary } from "@/types/progress";
import type { BuilderScoreResult } from "@/types/score";
import type { ReputationResult } from "@/types/reputation";
import type { GithubRepositoryRecord } from "@/types/github";
import type { PullRequestPortfolioItem } from "@/types/portfolio";
import type { TimelineEvent } from "@/types/timeline";

export type PublicContributionStats = {
  lessonsCompleted: number;
  roadmapsStarted: number;
  roadmapsCompleted: number;
  projectsCompleted: number;
  projectsApproved: number;
  achievementsUnlocked: number;
  mergedPullRequests: number;
  repositories: number;
  uniqueContributionRepos: number;
  languagesUsed: number;
};

export type PublicCompletedProject = {
  roadmapSlug: string;
  nodeSlug: string;
  projectSlug: string;
  title: string;
  completedAt: string | null;
  submissionStatus?: string | null;
  repoUrl?: string | null;
};

export type PortfolioTechnology = {
  name: string;
  count: number;
};

export type PublicBuilderProfileData = {
  profile: PublicBuilderProfile;
  level: {
    level: number;
    xp: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
    progressPercentage: number;
  };
  builderScore: BuilderScoreResult;
  reputation: ReputationResult;
  stats: PublicContributionStats;
  skills: string[];
  technologies: PortfolioTechnology[];
  featuredRepositories: GithubRepositoryRecord[];
  featuredProjects: PublicCompletedProject[];
  mergedPrHighlights: PullRequestPortfolioItem[];
  timeline: TimelineEvent[];
  roadmaps: RoadmapProgressSummary[];
  achievements: AchievementItem[];
  /** @deprecated use featuredProjects */
  recentProjects: PublicCompletedProject[];
  isOwner: boolean;
};
