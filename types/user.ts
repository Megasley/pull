import {
  normalizeEmailNotificationPrefs,
  type EmailNotificationPrefs,
} from "@/types/notifications";

import {
  normalizeAccountStatus,
  type UserAccountStatus,
} from "@/lib/auth/account-status";
import { normalizeLookingFor, type LookingForId } from "@/lib/builders/looking-for";
import { isOpenToStatus, type OpenToStatus } from "@/lib/profile/open-to";

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
  /** Optional, self-reported ISO 3166-1 alpha-2 code. Only shown on the
   *  public profile when showCountryPublicly is true — see
   *  toPublicBuilderProfile — otherwise used only in aggregate impact
   *  reporting (lib/impact/*). */
  country: string | null;
  /** Opt-in flag: show the country flag on the public profile/card. */
  showCountryPublicly: boolean;
  /** Optional public hire/collaborate status. Null = never set. See
   *  lib/profile/open-to.ts. */
  openTo: OpenToStatus | null;
  /** Up to 4 synced repo full names ("owner/repo"), builder's chosen order.
   *  See components/profile/portfolio-sections.tsx:FeaturedRepositoriesSection. */
  pinnedRepos: string[];
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
};

/** Safe subset for anonymous public portfolio pages (no email / prefs / moderation).
 *  `country` is included but value-gated by showCountryPublicly — see below. */
export type PublicBuilderProfile = Omit<
  BuilderProfile,
  "email" | "emailNotifications" | "moderationReason" | "showCountryPublicly"
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
    // Only surfaced when the user has explicitly opted in.
    country: profile.showCountryPublicly ? profile.country : null,
    openTo: profile.openTo,
    pinnedRepos: profile.pinnedRepos,
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
  country?: string | null;
  show_country_publicly?: boolean | null;
  open_to?: string | null;
  pinned_repos?: string[] | null;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
};

function normalizeStringArray(value: unknown): string[] {
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
    skills: normalizeStringArray(row.skills),
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
    country: row.country ?? null,
    showCountryPublicly: row.show_country_publicly ?? false,
    openTo: row.open_to && isOpenToStatus(row.open_to) ? row.open_to : null,
    pinnedRepos: normalizeStringArray(row.pinned_repos).slice(0, 4),
    xp: row.xp,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
