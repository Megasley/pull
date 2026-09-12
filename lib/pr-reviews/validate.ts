const GITHUB_PR_URL_PATTERN =
  /^https:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/pull\/(\d+)\/?$/;

export type ParsedPrUrl = {
  owner: string;
  repo: string;
  number: number;
  repoFullName: string;
};

/**
 * Parses a GitHub PR URL into its parts. A fresh, local copy rather than
 * reusing lib/submissions/validate.ts's GITHUB_PR_PATTERN — that system may
 * be torn down separately, and this feature shouldn't depend on it.
 */
export function parsePrUrl(url: string): ParsedPrUrl | null {
  const match = GITHUB_PR_URL_PATTERN.exec(url.trim());
  if (!match) {
    return null;
  }

  const [, owner, repo, numberRaw] = match;
  const number = Number(numberRaw);
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return { owner, repo, number, repoFullName: `${owner}/${repo}` };
}
