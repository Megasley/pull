import { fetchRepoPullRequestsNeedingReview } from "@/lib/github/api";
import { GithubClient } from "@/lib/github/client";
import { getAllDiscoveryRepositories } from "@/lib/discovery/catalog";
import { existsOpenRequestFor, insertDiscoveredReviewRequest } from "@/lib/pr-reviews/repository";

const MAX_PER_REPO = 3;
const MAX_TOTAL_PER_RUN = 20;

/**
 * Auto-populates the PR review queue from Pull's existing curated ecosystem
 * catalog (content/discovery/repositories.json — the same list the
 * "Discover" page uses), so the dashboard has real, notable Bitcoin/
 * Lightning PRs to review from day one instead of depending entirely on
 * admins or peers to add every entry by hand. Inserted as `admin_curated`
 * (ranks the same as a human admin manually curating one).
 *
 * Runs unauthenticated by default (fine at this volume — ~20 repos, one
 * search request each); set GITHUB_DISCOVERY_TOKEN to run authenticated if
 * unauthenticated ever proves rate-limit-flaky on shared serverless IPs.
 */
export async function discoverEcosystemReviewRequests(): Promise<{
  scanned: number;
  added: number;
}> {
  const client = new GithubClient(process.env.GITHUB_DISCOVERY_TOKEN ?? "");
  const repos = getAllDiscoveryRepositories();

  let added = 0;
  for (const repo of repos) {
    if (added >= MAX_TOTAL_PER_RUN) break;

    let candidates;
    try {
      candidates = await fetchRepoPullRequestsNeedingReview(
        client,
        repo.repository,
        MAX_PER_REPO,
      );
    } catch (error) {
      console.warn(`[pr-review-discovery] failed to search ${repo.repository}:`, error);
      continue;
    }

    for (const pr of candidates) {
      if (added >= MAX_TOTAL_PER_RUN) break;

      const exists = await existsOpenRequestFor(pr.repoFullName, pr.number);
      if (exists) continue;

      await insertDiscoveredReviewRequest({
        prUrl: pr.htmlUrl,
        repoFullName: pr.repoFullName,
        number: pr.number,
        title: pr.title,
        authorLogin: pr.authorLogin,
        prCreatedAt: pr.githubCreatedAt,
      });
      added += 1;
    }
  }

  return { scanned: repos.length, added };
}
