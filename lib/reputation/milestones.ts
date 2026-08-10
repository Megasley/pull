import type { ReputationMilestone, ReputationMonthPoint } from "@/types/reputation";
import type { PullRequestPortfolioItem } from "@/types/portfolio";

import { REPUTATION_MONTHS } from "./weights";

function monthKey(iso: string): string | null {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return null;
  const date = new Date(time);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function buildMonthlyProgress(
  input: {
    pullRequests: PullRequestPortfolioItem[];
    issueTimestamps: Array<string | null>;
    reviewTimestamps: Array<string | null>;
  },
  now = new Date(),
  months = REPUTATION_MONTHS,
): ReputationMonthPoint[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    keys.push(`${date.getUTCFullYear()}-${month}`);
  }

  const buckets = new Map<string, ReputationMonthPoint>(
    keys.map((key) => [
      key,
      {
        key,
        label: monthLabel(key),
        merged: 0,
        opened: 0,
        issues: 0,
        reviews: 0,
        total: 0,
      },
    ]),
  );

  for (const pr of input.pullRequests) {
    if (pr.merged && pr.mergedAt) {
      const key = monthKey(pr.mergedAt);
      const bucket = key ? buckets.get(key) : null;
      if (bucket) {
        bucket.merged += 1;
        bucket.total += 1;
      }
    }
    if (pr.createdAt) {
      const key = monthKey(pr.createdAt);
      const bucket = key ? buckets.get(key) : null;
      if (bucket) {
        bucket.opened += 1;
        if (!pr.merged || monthKey(pr.mergedAt ?? "") !== key) {
          bucket.total += 1;
        }
      }
    }
  }

  for (const stamp of input.issueTimestamps) {
    if (!stamp) continue;
    const key = monthKey(stamp);
    const bucket = key ? buckets.get(key) : null;
    if (bucket) {
      bucket.issues += 1;
      bucket.total += 1;
    }
  }

  for (const stamp of input.reviewTimestamps) {
    if (!stamp) continue;
    const key = monthKey(stamp);
    const bucket = key ? buckets.get(key) : null;
    if (bucket) {
      bucket.reviews += 1;
      bucket.total += 1;
    }
  }

  return keys.map((key) => buckets.get(key)!);
}

export function buildReputationMilestones(input: {
  mergedPullRequests: number;
  uniqueRepos: number;
  documentationContributions: number;
  codeReviews: number;
  issueDiscussions: number;
  firstMergedAt: string | null;
}): ReputationMilestone[] {
  return [
    {
      id: "first-merge",
      title: "First merge",
      description: "Landed your first merged pull request.",
      earned: input.mergedPullRequests >= 1,
      earnedAt: input.firstMergedAt,
    },
    {
      id: "five-merges",
      title: "Five merges",
      description: "Five pull requests accepted upstream.",
      earned: input.mergedPullRequests >= 5,
      earnedAt: null,
    },
    {
      id: "multi-repo",
      title: "Multi-repo contributor",
      description: "Merged into at least three different repositories.",
      earned: input.uniqueRepos >= 3,
      earnedAt: null,
    },
    {
      id: "docs-shipped",
      title: "Docs shipper",
      description: "Merged a documentation contribution.",
      earned: input.documentationContributions >= 1,
      earnedAt: null,
    },
    {
      id: "reviewer",
      title: "Active reviewer",
      description: "Helped other builders with five code reviews.",
      earned: input.codeReviews >= 5,
      earnedAt: null,
    },
    {
      id: "issue-starter",
      title: "Issue starter",
      description: "Opened three issues to drive project work.",
      earned: input.issueDiscussions >= 3,
      earnedAt: null,
    },
  ];
}

export function countActiveMonths(
  timestamps: Array<string | null | undefined>,
  months = REPUTATION_MONTHS,
  now = new Date(),
): number {
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
  );
  const keys = new Set<string>();

  for (const stamp of timestamps) {
    if (!stamp) continue;
    const time = Date.parse(stamp);
    if (!Number.isFinite(time) || time < cutoff.getTime()) continue;
    const key = monthKey(stamp);
    if (key) keys.add(key);
  }

  return keys.size;
}
