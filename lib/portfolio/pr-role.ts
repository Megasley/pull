import type { PullRequestContributorRole } from "@/types/portfolio";

/**
 * Classifies a merged (or any) pull request by the builder's relationship
 * to its repo. Pure and dependency-free — see tests/pr-presentation.test.ts.
 *
 * `isOwnRepo` is the ground truth for "self" (computed once at sync time in
 * lib/github/sync.ts from the repo owner segment vs. the connected GitHub
 * login). Everything else the builder has collaborator/org-member access to
 * — i.e. it showed up in their synced repos list — counts as "maintainer".
 * Anything left over is "external": a repo the builder has no access to,
 * the strongest open source signal.
 */
export function classifyPullRequest(
  pr: { repoFullName: string; isOwnRepo: boolean },
  context: { maintainedRepoFullNames: ReadonlySet<string> },
): PullRequestContributorRole {
  if (pr.isOwnRepo) return "self";
  if (context.maintainedRepoFullNames.has(pr.repoFullName)) return "maintainer";
  return "external";
}

export const PR_ROLE_LABEL: Record<PullRequestContributorRole, string | null> = {
  external: "External",
  maintainer: "Maintainer",
  // "self" isn't shown as a tag — it's the implicit default for a personal
  // project and would just be noise on every own-repo PR.
  self: null,
};
