import type { AchievementItem, ContributionStreak } from "@/types/dashboard";
import type { LookingForId } from "@/lib/builders/looking-for";
import type { PublicBuilderProfile } from "@/types/user";
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

export type PublicProfileActivity = {
  memberSince: string;
  lastActiveAt: string | null;
  lastContributionAt: string | null;
  activeRecently: boolean;
  streak: ContributionStreak;
};

export type ContributionMixItem = {
  label: string;
  count: number;
  percent: number;
};

export type PublicContributionMix = {
  prTypes: ContributionMixItem[];
  activityTypes: ContributionMixItem[];
};

export type ProfileCollaborationCta = {
  id: LookingForId;
  label: string;
  message: string;
  actionLabel: string;
  href: string;
  external?: boolean;
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
  achievements: AchievementItem[];
  /** @deprecated use featuredProjects */
  recentProjects: PublicCompletedProject[];
  strengthLine: string | null;
  activity: PublicProfileActivity;
  contributionMix: PublicContributionMix;
  collaborationCtas: ProfileCollaborationCta[];
  partnerOrigin: { slug: string; name: string } | null;
  isOwner: boolean;
};
