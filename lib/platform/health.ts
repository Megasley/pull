import { isDatabaseConfigured } from "@/lib/db/env";
import { isEmailConfigured } from "@/lib/email/client";
import { isGithubOAuthConfigured } from "@/lib/github/env";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type PlatformHealth = {
  database: boolean;
  supabaseAuth: boolean;
  githubOAuth: boolean;
  resend: boolean;
  cronSecret: boolean;
};

export function getPlatformHealth(): PlatformHealth {
  return {
    database: isDatabaseConfigured(),
    supabaseAuth: isSupabaseConfigured(),
    githubOAuth: isGithubOAuthConfigured(),
    resend: isEmailConfigured(),
    cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
  };
}

export function getPlatformHealthIssues(health: PlatformHealth): string[] {
  const issues: string[] = [];
  if (!health.database) issues.push("Database is not configured.");
  if (!health.supabaseAuth) issues.push("Supabase auth is not configured.");
  if (!health.githubOAuth) issues.push("GitHub OAuth is not configured.");
  if (!health.resend) issues.push("Email delivery (Resend) is not configured.");
  if (!health.cronSecret) issues.push("Cron secret is not configured.");
  return issues;
}
