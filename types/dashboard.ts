import type { BuilderProfile } from "@/types/user";
import type { RoadmapProgressSummary } from "@/types/progress";
import type { BuilderScoreResult } from "@/types/score";
import type { ReputationResult } from "@/types/reputation";

export type ContinueLearningItem = {
  roadmapSlug: string;
  roadmapTitle: string;
  lessonSlug: string;
  lessonTitle: string;
  description: string;
  duration: string;
  difficulty: string;
};

export type RecentLessonItem = {
  roadmapSlug: string;
  lessonSlug: string;
  title: string;
  completedAt: string | null;
};

export type ProjectInProgressItem = {
  roadmapSlug: string;
  nodeSlug: string;
  title: string;
  project: string;
  duration: string;
  difficulty: string;
};

export type RecommendedLessonItem = {
  roadmapSlug: string;
  roadmapTitle: string;
  lessonSlug: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
};

export type AchievementItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category?: string;
  xpReward?: number;
  earned: boolean;
  earnedAt?: string | null;
  /** True when unlocked in the last few minutes - drives celebrate animation */
  recentlyUnlocked?: boolean;
};

export type OpenSourceOpportunity = {
  id: string;
  title: string;
  repository: string;
  description: string;
  url: string;
  tags: string[];
};

export type ContributionStreak = {
  current: number;
  longest: number;
  totalDays: number;
};

export type BuiltProjectItem = {
  id: string;
  title: string;
  projectSlug: string;
  source: "submission" | "roadmap";
  href: string;
  completedAt: string | null;
};

export type ContributingRepoItem = {
  fullName: string;
  openPullRequests: number;
  openIssues: number;
  href: string;
};

export type OpenPullRequestItem = {
  id: string;
  title: string;
  number: number;
  repoFullName: string;
  htmlUrl: string;
  reviewComments: number;
  githubCreatedAt: string | null;
};

export type AssignedIssueItem = {
  id: string;
  title: string;
  number: number;
  repoFullName: string;
  htmlUrl: string;
  githubCreatedAt: string | null;
};

export type ReviewReceivedItem = {
  id: string;
  projectTitle: string;
  projectSlug: string;
  decision: string;
  reviewRound: number;
  body: string;
  createdAt: string;
  href: string;
};

export type PortfolioCompletionItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type PortfolioCompletion = {
  percentage: number;
  completed: number;
  total: number;
  items: PortfolioCompletionItem[];
};

export type WeeklyGoalItem = {
  id: string;
  title: string;
  targetType: "open_pr" | "merge_pr" | "complete_lesson" | "custom";
  targetCount: number;
  progressCount: number;
  weekStart: string;
};

export type BuilderLevelInfo = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercentage: number;
};

export type DashboardData = {
  profile: BuilderProfile;
  continueLearning: ContinueLearningItem | null;
  roadmapProgress: RoadmapProgressSummary[];
  recentLessons: RecentLessonItem[];
  projectsInProgress: ProjectInProgressItem[];
  achievements: AchievementItem[];
  builderLevel: BuilderLevelInfo;
  builderScore: BuilderScoreResult | null;
  reputation: ReputationResult | null;
  recommendedLessons: RecommendedLessonItem[];
  openSourceOpportunities: OpenSourceOpportunity[];
  contributionStreak: ContributionStreak;
  projectsBuilt: BuiltProjectItem[];
  contributingRepos: ContributingRepoItem[];
  openPullRequests: OpenPullRequestItem[];
  assignedIssues: AssignedIssueItem[];
  reviewsReceived: ReviewReceivedItem[];
  portfolioCompletion: PortfolioCompletion;
  weeklyGoals: WeeklyGoalItem[];
};
