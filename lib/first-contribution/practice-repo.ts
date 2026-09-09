/** Single source of truth for the First Contribution practice repository.
 *  Every link elsewhere in this feature is derived from these constants —
 *  nothing should hardcode a github.com/... URL directly. */
export const PRACTICE_REPO_OWNER = "Megasley";
export const PRACTICE_REPO_NAME = "pull-first-contribution";
export const PRACTICE_REPO_FULL_NAME = `${PRACTICE_REPO_OWNER}/${PRACTICE_REPO_NAME}`;
export const PRACTICE_REPO_URL = `https://github.com/${PRACTICE_REPO_FULL_NAME}`;

/** Deliberately NOT the generic "good first issue" label: that's the
 *  global convention GitHub's own discovery surfaces and third-party
 *  contribution bots/agents scan for across every public repo, and it was
 *  closing out this repo's small, finite issue pool before real beginners
 *  could claim them (e.g. an autonomous coding-agent account auto-submitted
 *  a PR against one within hours of the issue going public). A repo-specific
 *  label keeps this pool reserved for people going through this journey. */
export const PRACTICE_ISSUE_LABEL = "pull-practice-issue";

export const practiceRepoLinks = {
  repository: PRACTICE_REPO_URL,
  issues: `${PRACTICE_REPO_URL}/issues`,
  // GitHub's own search box encodes spaces as "+", not %20 — matched here so
  // the URL looks identical to one a user would build by hand.
  goodFirstIssues: `${PRACTICE_REPO_URL}/issues?q=${encodeURIComponent(
    `is:open is:issue label:${PRACTICE_ISSUE_LABEL}`,
  ).replace(/%20/g, "+")}`,
  fork: `${PRACTICE_REPO_URL}/fork`,
  pullRequests: `${PRACTICE_REPO_URL}/pulls`,
  contributing: `${PRACTICE_REPO_URL}/blob/main/CONTRIBUTING.md`,
} as const;

/** GitHub repo full names are case-insensitive — match the same way GitHub does. */
export function isPracticeRepoFullName(repoFullName: string): boolean {
  return repoFullName.toLowerCase() === PRACTICE_REPO_FULL_NAME.toLowerCase();
}
