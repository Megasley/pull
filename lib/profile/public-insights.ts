import { isActiveRecently } from "@/lib/builders/directory";
import { CONTRIBUTION_TYPE_LABEL } from "@/lib/portfolio/filter";
import type { ContributionStreak } from "@/types/dashboard";
import type { ContributionType, PullRequestPortfolioItem } from "@/types/portfolio";
import type { PublicContributionMix, PublicProfileActivity } from "@/types/profile";
import type { BuilderScoreResult } from "@/types/score";
import type { ReputationResult } from "@/types/reputation";
import type { TimelineEvent, TimelineEventType } from "@/types/timeline";

function topFactor<T extends { label: string; strengthPercent: number }>(
  factors: T[],
): T | null {
  return [...factors].sort((a, b) => b.strengthPercent - a.strengthPercent)[0] ?? null;
}

export function buildProfileStrengthLine(
  builderScore: BuilderScoreResult,
  reputation: ReputationResult,
): string | null {
  const builderTop = topFactor(
    builderScore.factors.filter((factor) => factor.strengthPercent > 0),
  );
  const reputationTop = topFactor(
    reputation.factors.filter((factor) => factor.strengthPercent > 0),
  );

  if (!builderTop && !reputationTop) return null;

  if (builderTop && reputationTop) {
    return `Strong on Pull in ${builderTop.label.toLowerCase()} · ${reputationTop.label.toLowerCase()} on GitHub`;
  }

  if (reputationTop) {
    return `Standout ${reputationTop.label.toLowerCase()} on GitHub`;
  }

  return `Standout ${builderTop!.label.toLowerCase()} on Pull`;
}

export function deriveLastContributionAt(events: TimelineEvent[]): string | null {
  let latest: string | null = null;
  let latestTime = 0;

  for (const event of events) {
    const time = Date.parse(event.occurredAt);
    if (!Number.isFinite(time) || time <= latestTime) continue;
    latestTime = time;
    latest = event.occurredAt;
  }

  return latest;
}

export function buildPublicProfileActivity(input: {
  createdAt: string;
  lastActiveAt: string | null;
  lastContributionAt: string | null;
  streak: ContributionStreak;
}): PublicProfileActivity {
  return {
    memberSince: input.createdAt,
    lastActiveAt: input.lastActiveAt,
    lastContributionAt: input.lastContributionAt,
    activeRecently: isActiveRecently(input.lastActiveAt),
    streak: input.streak,
  };
}

const ACTIVITY_TYPE_LABELS: Record<TimelineEventType, string> = {
  commit: "Commits",
  pull_request: "Pull requests",
  issue: "Issues",
  review: "Reviews given",
  merged: "Merged PRs",
  project_submission: "Project submissions",
  roadmap_completion: "Roadmap milestones",
  qa_answer_accepted: "Accepted Q&A answers",
};

const PR_TYPE_ORDER: ContributionType[] = [
  "feature",
  "bug_fix",
  "documentation",
  "test",
  "refactor",
  "chore",
  "other",
];

export function buildContributionMix(
  mergedPrs: PullRequestPortfolioItem[],
  timelineTotals: Record<TimelineEventType, number>,
): PublicContributionMix {
  const prTypeCounts = new Map<ContributionType, number>();

  for (const pr of mergedPrs) {
    prTypeCounts.set(pr.contributionType, (prTypeCounts.get(pr.contributionType) ?? 0) + 1);
  }

  const prTotal = mergedPrs.length;
  const prTypes = PR_TYPE_ORDER.map((type) => ({
    label: CONTRIBUTION_TYPE_LABEL[type],
    count: prTypeCounts.get(type) ?? 0,
    percent: 0,
  }))
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      percent: prTotal > 0 ? Math.round((item.count / prTotal) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const activityEntries = (
    Object.entries(timelineTotals) as [TimelineEventType, number][]
  )
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      label: ACTIVITY_TYPE_LABELS[type],
      count,
      percent: 0,
    }))
    .sort((a, b) => b.count - a.count);

  const activityTotal = activityEntries.reduce((sum, item) => sum + item.count, 0);
  const activityTypes = activityEntries.slice(0, 5).map((item) => ({
    ...item,
    percent: activityTotal > 0 ? Math.round((item.count / activityTotal) * 100) : 0,
  }));

  return { prTypes, activityTypes };
}

export function formatProfileDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function formatRelativeActivity(iso: string | null): string | null {
  if (!iso) return null;

  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;

  const diffMs = Date.now() - time;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return formatProfileDate(iso);
}
