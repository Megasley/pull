import {
  normalizeEmailNotificationPrefs,
  type EmailNotificationPrefs,
} from "@/types/notifications";

import {
  normalizeAccountStatus,
  type UserAccountStatus,
} from "@/lib/auth/account-status";
import { normalizeLookingFor, type LookingForId } from "@/lib/builders/looking-for";

export type BuilderProfile = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  githubUsername: string;
  email: string | null;
  website: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  lookingFor: LookingForId[];
  profilePublic: boolean;
  listedInDirectory: boolean;
  builderScore: number;
  ossReputation: number;
  scoresUpdatedAt: string | null;
  emailNotifications: EmailNotificationPrefs;
  role: "builder" | "reviewer" | "admin";
  accountStatus: UserAccountStatus;
  moderationReason: string | null;
  onboardingCompletedAt: string | null;
  preferredRoadmapSlug: string | null;
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
};

/** Safe subset for anonymous public portfolio pages (no email / prefs / moderation). */
export type PublicBuilderProfile = Omit<
  BuilderProfile,
  "email" | "emailNotifications" | "moderationReason"
>;

export function toPublicBuilderProfile(profile: BuilderProfile): PublicBuilderProfile {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatar: profile.avatar,
    bio: profile.bio,
    githubUsername: profile.githubUsername,
    website: profile.website,
    twitterUrl: profile.twitterUrl,
    linkedinUrl: profile.linkedinUrl,
    skills: profile.skills,
    lookingFor: profile.lookingFor,
    profilePublic: profile.profilePublic,
    listedInDirectory: profile.listedInDirectory,
    builderScore: profile.builderScore,
    ossReputation: profile.ossReputation,
    scoresUpdatedAt: profile.scoresUpdatedAt,
    role: profile.role,
    accountStatus: profile.accountStatus,
    onboardingCompletedAt: profile.onboardingCompletedAt,
    preferredRoadmapSlug: profile.preferredRoadmapSlug,
    xp: profile.xp,
    level: profile.level,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export type BuilderProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  bio: string;
  github_username: string;
  email?: string | null;
  website?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  skills?: string[] | null;
  looking_for?: string[] | null;
  profile_public?: boolean | null;
  listed_in_directory?: boolean | null;
  builder_score?: number | null;
  oss_reputation?: number | null;
  scores_updated_at?: string | null;
  email_notifications?: EmailNotificationPrefs | null;
  role?: "builder" | "reviewer" | "admin" | null;
  account_status?: UserAccountStatus | null;
  moderation_reason?: string | null;
  onboarding_completed_at?: string | null;
  preferred_roadmap_slug?: string | null;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
};

function normalizeSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapBuilderProfile(row: BuilderProfileRow): BuilderProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatar: row.avatar,
    bio: row.bio,
    githubUsername: row.github_username,
    email: row.email ?? null,
    website: row.website ?? null,
    twitterUrl: row.twitter_url ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    skills: normalizeSkills(row.skills),
    lookingFor: normalizeLookingFor(row.looking_for),
    profilePublic: row.profile_public ?? true,
    listedInDirectory: row.listed_in_directory ?? true,
    builderScore: row.builder_score ?? 0,
    ossReputation: row.oss_reputation ?? 0,
    scoresUpdatedAt: row.scores_updated_at ?? null,
    emailNotifications: normalizeEmailNotificationPrefs(row.email_notifications),
    role: row.role ?? "builder",
    accountStatus: normalizeAccountStatus(row.account_status),
    moderationReason: row.moderation_reason ?? null,
    onboardingCompletedAt: row.onboarding_completed_at ?? null,
    preferredRoadmapSlug: row.preferred_roadmap_slug ?? null,
    xp: row.xp,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
