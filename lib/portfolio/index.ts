import {
  getGithubConnectionPublic,
  listGithubPullRequests,
  listGithubReviewedPullRequests,
} from "@/lib/github/store";
import {
  getPortfolioCadence,
  getPortfolioRepoBreakdown,
  getPortfolioStats,
  toPortfolioItem,
  toReviewItem,
} from "@/lib/portfolio/filter";
import type {
  PortfolioCadence,
  PortfolioRepoBreakdown,
  PullRequestPortfolioItem,
  PullRequestReviewItem,
} from "@/types/portfolio";

export async function loadPullRequestPortfolio(userId: string): Promise<{
  items: PullRequestPortfolioItem[];
  stats: ReturnType<typeof getPortfolioStats> & { reviewsGiven: number };
  reviews: PullRequestReviewItem[];
  topRepos: PortfolioRepoBreakdown[];
  cadence: PortfolioCadence;
  connected: boolean;
  lastSyncedAt: string | null;
}> {
  const [connection, pullRequests, reviewedPullRequests] = await Promise.all([
    getGithubConnectionPublic(userId),
    listGithubPullRequests(userId),
    listGithubReviewedPullRequests(userId),
  ]);

  const items = pullRequests.map(toPortfolioItem);
  const reviews = reviewedPullRequests.map(toReviewItem);

  return {
    items,
    stats: { ...getPortfolioStats(items), reviewsGiven: reviews.length },
    reviews,
    topRepos: getPortfolioRepoBreakdown(items),
    cadence: getPortfolioCadence(items),
    connected: Boolean(connection),
    lastSyncedAt: connection?.lastSyncedAt ?? null,
  };
}

export {
  PORTFOLIO_PAGE_SIZE,
  CONTRIBUTION_TYPE_LABEL,
  PORTFOLIO_STATUS_LABEL,
  PORTFOLIO_SORT_LABEL,
  DEFAULT_PORTFOLIO_FILTERS,
  filterPortfolioItems,
  filterReviewItems,
  sortPortfolioItems,
  paginatePortfolioItems,
  getPortfolioLanguages,
  getPortfolioRepoBreakdown,
  getPortfolioCadence,
  getPortfolioStats,
  toPortfolioItem,
  toReviewItem,
  inferContributionType,
} from "./filter";
