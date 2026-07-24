export type GithubContributionType =
  | "documentation"
  | "bug_fix"
  | "feature"
  | "test"
  | "refactor"
  | "chore"
  | "other";

export function inferContributionType(
  title: string,
  labels: string[] = [],
): GithubContributionType {
  const haystack = `${title} ${labels.join(" ")}`.toLowerCase();

  if (
    /\b(docs?|documentation|readme|typo)\b/.test(haystack) ||
    labels.some((label) => /docs?/i.test(label))
  ) {
    return "documentation";
  }
  if (/\b(fix|bug|hotfix)\b/.test(haystack) || labels.some((l) => /bug/i.test(l))) {
    return "bug_fix";
  }
  if (/\b(test|spec|coverage)\b/.test(haystack)) return "test";
  if (/\b(refactor|cleanup)\b/.test(haystack)) return "refactor";
  if (/\b(chore|ci|deps?|dependency)\b/.test(haystack)) return "chore";
  if (
    /\b(feat|feature|add|implement|support)\b/.test(haystack) ||
    labels.some((l) => /enhancement|feature/i.test(l))
  ) {
    return "feature";
  }
  return "other";
}
