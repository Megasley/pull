import issuesCatalog from "@/content/discovery/issues.json";
import { getDiscoveryRepositoryById } from "@/lib/discovery/catalog";
import type {
  CuratedIssue,
  IssueCategory,
  IssueRecommendation,
  IssueRecommendationContext,
} from "@/types/issues";

const issues = issuesCatalog as CuratedIssue[];

export const ISSUE_CATEGORIES: IssueCategory[] = [
  "good_first_issue",
  "help_wanted",
  "documentation",
  "bug_fix",
  "feature_request",
];

export const ISSUE_CATEGORY_LABEL: Record<IssueCategory, string> = {
  good_first_issue: "Good first issues",
  help_wanted: "Help wanted",
  documentation: "Documentation",
  bug_fix: "Bug fixes",
  feature_request: "Feature requests",
};

export const ISSUE_CATEGORY_SINGULAR: Record<IssueCategory, string> = {
  good_first_issue: "Good first issue",
  help_wanted: "Help wanted",
  documentation: "Documentation",
  bug_fix: "Bug fix",
  feature_request: "Feature request",
};

export function getAllCuratedIssues(): CuratedIssue[] {
  return issues;
}

export function getCuratedIssueById(id: string): CuratedIssue | null {
  return issues.find((issue) => issue.id === id) ?? null;
}

/**
 * Score curated issues for a builder. Guarantees unique issue IDs and
 * caps how many issues can come from the same repository.
 */
export function recommendIssues(
  context: IssueRecommendationContext,
  options: {
    limit?: number;
    category?: IssueCategory | "all";
    maxPerRepo?: number;
  } = {},
): IssueRecommendation[] {
  const limit = options.limit ?? 12;
  const maxPerRepo = options.maxPerRepo ?? 2;
  const dismissed = new Set(context.dismissedIssueIds ?? []);
  const saved = new Set(context.savedIssueIds ?? []);
  const languages = new Set(context.languages.map((item) => item.toLowerCase()));
  const completedTracks = new Set(context.completedRoadmapSlugs);
  const recommendedRepos = new Set(context.recommendedRepoIds);
  const projectCount = context.completedProjectSlugs.length;

  const scored: IssueRecommendation[] = [];

  for (const issue of issues) {
    if (dismissed.has(issue.id)) continue;
    if (options.category && options.category !== "all" && issue.category !== options.category) {
      continue;
    }

    const repo = getDiscoveryRepositoryById(issue.repoId);
    if (!repo) continue;

    const reasons: string[] = [];
    let score = 0;

    for (const track of issue.tracks) {
      if (completedTracks.has(track)) {
        score += 30;
        reasons.push(`Aligned with your completed ${track} roadmap`);
      }
    }

    if (languages.has(issue.language.toLowerCase())) {
      score += 28;
      reasons.push(`Matches your ${issue.language} GitHub activity`);
    }

    if (recommendedRepos.has(issue.repoId)) {
      score += 22;
      reasons.push(`${repo.name} is in your recommended repositories`);
    }

    if (context.level >= repo.minLevel) {
      score += 12;
      reasons.push(`Fits builders around level ${repo.minLevel}+`);
    } else if (issue.difficulty === "beginner") {
      score += 6;
      reasons.push("Beginner-friendly while you level up");
    } else {
      score -= 12;
    }

    if (projectCount > 0) {
      score += Math.min(15, projectCount * 3);
      reasons.push(
        `You've completed ${projectCount} project${projectCount === 1 ? "" : "s"} on Pull`,
      );
    }

    if (context.githubActivityCount > 0) {
      score += Math.min(12, context.githubActivityCount);
      reasons.push("Active GitHub contributors get prioritized issue matches");
    }

    switch (issue.category) {
      case "good_first_issue":
        if (context.level <= 2 || projectCount < 2) {
          score += 18;
          reasons.push("Good first issue for builders early in their OSS path");
        }
        break;
      case "documentation":
        if (context.level <= 3) {
          score += 14;
          reasons.push("Docs tasks are a strong on-ramp to maintainers");
        }
        break;
      case "help_wanted":
        score += 10;
        reasons.push("Maintainers explicitly flagged help wanted");
        break;
      case "bug_fix":
        if (context.level >= 3 || context.githubActivityCount >= 8) {
          score += 16;
          reasons.push("Bug fixes suit builders with more shipping experience");
        } else {
          score -= 4;
        }
        break;
      case "feature_request":
        if (projectCount >= 2 || context.level >= 2) {
          score += 12;
          reasons.push("Feature work pairs well with project experience");
        }
        break;
    }

    if (saved.has(issue.id)) {
      score += 40;
      reasons.unshift("Saved by you");
    }

    if (reasons.length === 0) {
      reasons.push("Curated contribution opportunity on Pull");
      score += 4;
    }

    // Deduplicate reasons while preserving order.
    const uniqueReasons = [...new Set(reasons)].slice(0, 3);

    scored.push({
      issue,
      repositoryName: repo.name,
      repositoryFullName: repo.repository,
      repositoryUrl: repo.url,
      score,
      reasons: uniqueReasons,
    });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.issue.title.localeCompare(b.issue.title) ||
      a.issue.id.localeCompare(b.issue.id),
  );

  const seenIssues = new Set<string>();
  const perRepo = new Map<string, number>();
  const selected: IssueRecommendation[] = [];

  for (const item of scored) {
    if (seenIssues.has(item.issue.id)) continue;
    const count = perRepo.get(item.issue.repoId) ?? 0;
    if (count >= maxPerRepo) continue;

    seenIssues.add(item.issue.id);
    perRepo.set(item.issue.repoId, count + 1);
    selected.push(item);

    if (selected.length >= limit) break;
  }

  return selected;
}

export function groupRecommendationsByCategory(
  recommendations: IssueRecommendation[],
): Array<{ category: IssueCategory; label: string; items: IssueRecommendation[] }> {
  return ISSUE_CATEGORIES.map((category) => ({
    category,
    label: ISSUE_CATEGORY_LABEL[category],
    items: recommendations.filter((item) => item.issue.category === category),
  })).filter((group) => group.items.length > 0);
}
