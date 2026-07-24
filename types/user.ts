import {
  normalizeEmailNotificationPrefs,
  type EmailNotificationPrefs,
} from "@/types/notifications";

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
  emailNotifications: EmailNotificationPrefs;
  role: "builder" | "reviewer" | "admin";
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
};

/** Safe subset for anonymous public portfolio pages (no email / prefs). */
export type PublicBuilderProfile = Omit<
  BuilderProfile,
  "email" | "emailNotifications"
>;

export function toPublicBuilderProfile(
  profile: BuilderProfile,
): PublicBuilderProfile {
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
    role: profile.role,
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
  email_notifications?: EmailNotificationPrefs | null;
  role?: "builder" | "reviewer" | "admin" | null;
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
    emailNotifications: normalizeEmailNotificationPrefs(row.email_notifications),
    role: row.role ?? "builder",
    xp: row.xp,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
