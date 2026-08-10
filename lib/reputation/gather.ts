import { and, desc, eq, ne } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { projectSubmissions, submissionReviewEvents } from "@/lib/db/schema";
import { listGithubIssues, listGithubPullRequests } from "@/lib/github/store";
import { toPortfolioItem } from "@/lib/portfolio/filter";
import type { ReputationInputs } from "@/types/reputation";

import {
  buildMonthlyProgress,
  buildReputationMilestones,
  countActiveMonths,
} from "./milestones";
import { calculateReputation } from "./calculate";
import type { ReputationResult } from "@/types/reputation";

async function countCodeReviews(userId: string): Promise<{
  count: number;
  timestamps: string[];
}> {
  if (!isDatabaseConfigured()) {
    return { count: 0, timestamps: [] };
  }

  const db = getDb();
  const rows = await db
    .select({
      id: submissionReviewEvents.id,
      createdAt: submissionReviewEvents.createdAt,
    })
    .from(submissionReviewEvents)
    .innerJoin(
      projectSubmissions,
      eq(submissionReviewEvents.submissionId, projectSubmissions.id),
    )
    .where(
      and(
        eq(submissionReviewEvents.actorUserId, userId),
        ne(projectSubmissions.userId, userId),
      ),
    )
    .orderBy(desc(submissionReviewEvents.createdAt))
    .limit(200);

  return {
    count: rows.length,
    timestamps: rows.map((row) => row.createdAt),
  };
}

export async function gatherReputationInputs(userId: string): Promise<{
  inputs: ReputationInputs;
  resultExtras: Pick<ReputationResult, "monthly" | "milestones">;
}> {
  const [pullRequests, issues, reviews] = await Promise.all([
    listGithubPullRequests(userId),
    listGithubIssues(userId, 200),
    countCodeReviews(userId),
  ]);

  const portfolio = pullRequests.map(toPortfolioItem);
  const merged = portfolio.filter((item) => item.merged);
  const uniqueRepos = new Set(merged.map((item) => item.repoFullName));
  const documentationContributions = merged.filter(
    (item) => item.contributionType === "documentation",
  ).length;
  const maintainerReviewComments = portfolio.reduce(
    (sum, item) => sum + item.reviewComments,
    0,
  );

  const activityTimestamps = [
    ...portfolio.map((item) => item.mergedAt ?? item.createdAt),
    ...issues.map((item) => item.githubCreatedAt),
    ...reviews.timestamps,
  ];

  const inputs: ReputationInputs = {
    mergedPullRequests: merged.length,
    maintainerReviewComments,
    activeMonths: countActiveMonths(activityTimestamps),
    uniqueRepos: uniqueRepos.size,
    documentationContributions,
    issueDiscussions: issues.length,
    codeReviews: reviews.count,
  };

  const monthly = buildMonthlyProgress({
    pullRequests: portfolio,
    issueTimestamps: issues.map((item) => item.githubCreatedAt),
    reviewTimestamps: reviews.timestamps,
  });

  const firstMergedAt =
    merged
      .map((item) => item.mergedAt)
      .filter((value): value is string => Boolean(value))
      .sort()[0] ?? null;

  const milestones = buildReputationMilestones({
    mergedPullRequests: inputs.mergedPullRequests,
    uniqueRepos: inputs.uniqueRepos,
    documentationContributions: inputs.documentationContributions,
    codeReviews: inputs.codeReviews,
    issueDiscussions: inputs.issueDiscussions,
    firstMergedAt,
  });

  return {
    inputs,
    resultExtras: { monthly, milestones },
  };
}

export async function loadOpenSourceReputation(
  userId: string,
): Promise<ReputationResult> {
  const { inputs, resultExtras } = await gatherReputationInputs(userId);
  return calculateReputation(inputs, resultExtras);
}

/** Lightweight total used when only a count is needed. */
export async function getReputationScore(userId: string): Promise<number> {
  const result = await loadOpenSourceReputation(userId);
  return result.score;
}
