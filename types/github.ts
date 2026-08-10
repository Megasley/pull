export type GithubSyncStatus = "idle" | "syncing" | "success" | "error";

export type GithubConnectionPublic = {
  login: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  name: string | null;
  bio: string;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  syncStatus: GithubSyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  connected: true;
};

export type GithubConnectionState = { connected: false } | GithubConnectionPublic;

export type GithubRepositoryRecord = {
  id: string;
  githubId: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  licenseSpdx: string | null;
  topics: string[];
  isFork: boolean;
  isPrivate: boolean;
  isPinned: boolean;
  defaultBranch: string | null;
  pushedAt: string | null;
  githubUpdatedAt: string | null;
};

export type GithubPullRequestRecord = {
  id: string;
  githubId: number;
  number: number;
  title: string;
  state: string;
  merged: boolean;
  repoFullName: string;
  htmlUrl: string;
  githubCreatedAt: string | null;
  githubMergedAt: string | null;
  labels: string[];
  language: string | null;
  filesChanged: number;
  additions: number;
  deletions: number;
  reviewComments: number;
  contributionType: string;
};

export type GithubIssueRecord = {
  id: string;
  githubId: number;
  number: number;
  title: string;
  state: string;
  repoFullName: string;
  htmlUrl: string;
  githubCreatedAt: string | null;
  relation: string;
};

export type GithubCommitRecord = {
  id: string;
  sha: string;
  message: string;
  repoFullName: string;
  htmlUrl: string;
  committedAt: string | null;
};

export type GithubContributionDay = {
  date: string;
  count: number;
  color: string | null;
};

export type GithubSyncSummary = {
  repositories: number;
  pullRequests: number;
  issues: number;
  commits: number;
  contributionDays: number;
  totalStars: number;
};

export type GithubDashboardSnapshot = {
  connection: GithubConnectionState;
  pinnedRepos: GithubRepositoryRecord[];
  recentRepos: GithubRepositoryRecord[];
  contributionDays: GithubContributionDay[];
  totals: {
    repositories: number;
    pullRequests: number;
    issues: number;
    commits: number;
  };
};
