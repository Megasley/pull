import { listGithubPullRequests } from "@/lib/github/store";
import { getGithubConnectionPublic } from "@/lib/github/store";
import {
  getPortfolioStats,
  toPortfolioItem,
} from "@/lib/portfolio/filter";
import type { PullRequestPortfolioItem } from "@/types/portfolio";

export async function loadPullRequestPortfolio(userId: string): Promise<{
  items: PullRequestPortfolioItem[];
  stats: ReturnType<typeof getPortfolioStats>;
  connected: boolean;
  lastSyncedAt: string | null;
}> {
  const [connection, pullRequests] = await Promise.all([
    getGithubConnectionPublic(userId),
    listGithubPullRequests(userId),
  ]);

  const items = pullRequests.map(toPortfolioItem);

  return {
    items,
    stats: getPortfolioStats(items),
    connected: Boolean(connection),
    lastSyncedAt: connection?.lastSyncedAt ?? null,
  };
}

export {
  PORTFOLIO_PAGE_SIZE,
  CONTRIBUTION_TYPE_LABEL,
  PORTFOLIO_STATUS_LABEL,
  filterPortfolioItems,
  paginatePortfolioItems,
  getPortfolioLanguages,
  getPortfolioStats,
  toPortfolioItem,
  inferContributionType,
} from "./filter";
