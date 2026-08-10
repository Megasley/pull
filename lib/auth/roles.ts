import type { UserRole } from "@/types/submission";

function parseGithubAllowlist(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getReviewerGithubAllowlist(): string[] {
  return parseGithubAllowlist(process.env.PULL_REVIEWER_GITHUB_USERNAMES ?? "");
}

export function getAdminGithubAllowlist(): string[] {
  return parseGithubAllowlist(process.env.PULL_ADMIN_GITHUB_USERNAMES ?? "");
}

export function resolveUserRole(
  githubUsername: string,
  currentRole?: UserRole | null,
): UserRole {
  const handle = githubUsername.toLowerCase();

  if (getAdminGithubAllowlist().includes(handle)) {
    return "admin";
  }

  if (currentRole === "admin") {
    return "admin";
  }

  if (getReviewerGithubAllowlist().includes(handle)) {
    return "reviewer";
  }

  if (currentRole === "reviewer") {
    return "reviewer";
  }

  return currentRole ?? "builder";
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

export function isReviewerRole(role: UserRole | null | undefined): boolean {
  return role === "reviewer" || role === "admin";
}
