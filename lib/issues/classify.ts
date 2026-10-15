import type { RoadmapDifficulty } from "@/types";
import type { IssueCategory } from "@/types/issues";

const GITHUB_ISSUE_URL_PATTERN =
  /^https:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/issues\/(\d+)\/?(?:[?#].*)?$/;

export type ParsedIssueUrl = {
  owner: string;
  repo: string;
  number: number;
  repoFullName: string;
};

export function parseIssueUrl(url: string): ParsedIssueUrl | null {
  const match = GITHUB_ISSUE_URL_PATTERN.exec(url.trim());
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

export type IssueClassification = {
  category: IssueCategory;
  difficulty: RoadmapDifficulty;
  skills: string[];
  estimatedHours: number;
};

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[_:/]+/g, " ")
    .replace(/[^a-z0-9+#. -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(labels: string[], needles: string[]): boolean {
  return labels.some((label) => needles.some((needle) => label.includes(needle)));
}

/** Labels that describe process/state rather than the work — never turned
 *  into skills. */
const NON_SKILL_LABELS = [
  "good first issue",
  "good-first-issue",
  "first timers",
  "beginner",
  "easy",
  "help wanted",
  "bug",
  "documentation",
  "docs",
  "enhancement",
  "feature",
  "question",
  "needs",
  "priority",
  "p0",
  "p1",
  "p2",
  "p3",
  "status",
  "triage",
  "wontfix",
  "duplicate",
  "invalid",
  "stale",
  "blocked",
  "hard",
  "difficulty",
  "medium",
  "advanced",
  "intermediate",
  "up for grabs",
];

const ESTIMATED_HOURS: Record<RoadmapDifficulty, number> = {
  beginner: 3,
  intermediate: 6,
  advanced: 12,
};

/**
 * Best-effort classification of a GitHub issue from its labels (plus the
 * repo's main language as a skill), so a submission arrives in the admin
 * queue pre-filled. Admins can still adjust everything before approving.
 */
export function classifyIssueFromLabels(
  rawLabels: string[],
  language: string | null,
): IssueClassification {
  const labels = rawLabels.map(normalizeLabel).filter(Boolean);

  const isFirstIssue = hasAny(labels, [
    "good first issue",
    "good-first-issue",
    "first timers",
    "beginner",
    "easy",
    "starter",
  ]);

  let category: IssueCategory = "help_wanted";
  if (isFirstIssue) {
    category = "good_first_issue";
  } else if (hasAny(labels, ["documentation", "docs"])) {
    category = "documentation";
  } else if (hasAny(labels, ["bug", "defect", "regression", "crash"])) {
    category = "bug_fix";
  } else if (hasAny(labels, ["enhancement", "feature", "improvement"])) {
    category = "feature_request";
  }

  let difficulty: RoadmapDifficulty = "intermediate";
  if (isFirstIssue || hasAny(labels, ["documentation", "docs"])) {
    difficulty = "beginner";
  }
  if (hasAny(labels, ["hard", "advanced", "expert", "complex", "difficulty high"])) {
    difficulty = "advanced";
  } else if (hasAny(labels, ["medium", "intermediate", "moderate"])) {
    difficulty = "intermediate";
  }

  const skills = new Set<string>();
  if (language) {
    skills.add(language.toLowerCase());
  }
  for (const label of labels) {
    if (NON_SKILL_LABELS.some((needle) => label.includes(needle))) continue;
    // Strip common "area:"/"component:" style prefixes, already turned into spaces.
    const skill = label.replace(/^(area|component|module|lang|language|topic|scope) /, "");
    if (skill.length > 0 && skill.length <= 24) {
      skills.add(skill);
    }
  }

  return {
    category,
    difficulty,
    skills: [...skills].slice(0, 6),
    estimatedHours: ESTIMATED_HOURS[difficulty],
  };
}

/** First paragraph of an issue body as plain-ish text, for a default card
 *  summary. */
export function summarizeIssueBody(body: string | null, fallback: string): string {
  const text = (body ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Drop headings ("## Context") outright — they'd otherwise become the
    // "first paragraph".
    .replace(/^#+\s.*$/gm, "")
    .replace(/[*_`>]/g, "");
  const paragraph =
    text
      .split(/\n\s*\n/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .find((part) => part.length > 0) ?? "";
  if (!paragraph) {
    return fallback;
  }
  return paragraph.length > 220 ? `${paragraph.slice(0, 217).trimEnd()}…` : paragraph;
}
