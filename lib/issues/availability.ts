import { getDiscoveryRepositoryById } from "@/lib/discovery/catalog";
import { GITHUB_API_BASE, GITHUB_USER_AGENT } from "@/lib/github/config";

import { getAllCuratedIssues } from "./engine";

/** How long a curated issue's open/closed state is trusted before GitHub is
 *  asked again. The catalog is small (one request per issue), so this keeps
 *  well inside even the unauthenticated rate limit. */
const ISSUE_STATE_REVALIDATE_SECONDS = 60 * 60 * 6;

export type IssueState = "open" | "closed" | "deleted" | "not_an_issue" | "unknown";

export async function fetchIssueState(repoFullName: string, number: number): Promise<IssueState> {
  const token = process.env.GITHUB_DISCOVERY_TOKEN;
  try {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/issues/${number}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": GITHUB_USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: ISSUE_STATE_REVALIDATE_SECONDS, tags: ["curated-issue-state"] },
    });

    // 404: issue (or repo) deleted / made private. 410: issue deleted.
    if (response.status === 404 || response.status === 410) {
      return "deleted";
    }
    if (!response.ok) {
      return "unknown";
    }

    // GitHub's issues endpoint also answers for PR numbers — a catalog entry
    // pointing at a PR isn't an issue anyone can pick up.
    const body = (await response.json()) as { state?: string; pull_request?: unknown };
    if (body.pull_request) {
      return "not_an_issue";
    }
    return body.state === "closed" ? "closed" : "open";
  } catch {
    return "unknown";
  }
}

/**
 * IDs of curated issues (content/discovery/issues.json) that are closed,
 * deleted, or actually a PR on GitHub, so recommendations stop suggesting
 * them. Fails open: if GitHub can't be reached or rate-limits us, the issue
 * stays recommended rather than silently emptying the list.
 */
export async function getUnavailableCuratedIssueIds(): Promise<string[]> {
  const issues = getAllCuratedIssues();
  const states = await Promise.all(
    issues.map(async (issue) => {
      const repo = getDiscoveryRepositoryById(issue.repoId);
      if (!repo) {
        return "unknown" as const;
      }
      return fetchIssueState(repo.repository, issue.number);
    }),
  );

  return issues
    .filter((_, index) => states[index] !== "open" && states[index] !== "unknown")
    .map((issue) => issue.id);
}
