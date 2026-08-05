export type OrganizationDifficulty = "beginner" | "intermediate" | "advanced";

export type OrganizationStat = {
  label: string;
  value: string;
};

export type OrganizationLink = {
  label: string;
  href: string;
};

export type OrganizationJourneyStep = {
  title: string;
  description: string;
  href?: string;
};

export type OrganizationJourneyStage = {
  id: string;
  label: string;
  summary: string;
  steps: OrganizationJourneyStep[];
};

export type OrganizationIssue = {
  id: string;
  title: string;
  repository: string;
  difficulty: OrganizationDifficulty;
  labels: string[];
  href: string;
};

export type OrganizationProject = {
  id: string;
  name: string;
  description: string;
  language: string;
  contributionLevel: OrganizationDifficulty;
  href: string;
};

export type OrganizationResource = {
  id: string;
  title: string;
  description: string;
  type: string;
  href: string;
};

export type OrganizationOpportunity = {
  id: string;
  title: string;
  description: string;
  kind: "role" | "grant" | "bounty" | "research";
  status: "open" | "rolling" | "upcoming";
  href?: string;
};

export type OrganizationCommunityLink = {
  id: string;
  name: string;
  description: string;
  href: string;
};

export type OrganizationMaintainer = {
  id: string;
  name: string;
  role: string;
  githubUsername: string;
  avatarUrl?: string;
};

export type OrganizationProfile = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  mission: string;
  whyContribute: string[];
  website: string;
  github: string;
  communityInvite: string;
  /** Official verification after a successful claim. */
  verified: boolean;
  /** Whether maintainers have claimed this directory profile. */
  claimed: boolean;
  lastUpdated: string;
  communityNotice: string;
  claimNotice: string;
  logoInitials: string;
  stats: OrganizationStat[];
  journey: OrganizationJourneyStage[];
  issues: OrganizationIssue[];
  projects: OrganizationProject[];
  resources: OrganizationResource[];
  opportunities: OrganizationOpportunity[];
  community: OrganizationCommunityLink[];
  maintainers: OrganizationMaintainer[];
};
