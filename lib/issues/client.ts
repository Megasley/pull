import type { IssueCategory, IssueRecommendationContext } from "@/types/issues";
import type { RoadmapDifficulty } from "@/types";

import { recommendIssues } from "./engine";

/** Client-safe re-ranker (no DB imports). */
export function rankIssuesForClient(
  context: IssueRecommendationContext,
  prefs: { savedIssueIds: string[]; dismissedIssueIds: string[] },
  options: {
    category?: IssueCategory | "all";
    difficulty?: RoadmapDifficulty | "all";
    skill?: string | "all";
  } = {},
) {
  return recommendIssues(
    {
      ...context,
      savedIssueIds: prefs.savedIssueIds,
      dismissedIssueIds: prefs.dismissedIssueIds,
    },
    {
      limit: 18,
      category: options.category ?? "all",
      difficulty: options.difficulty ?? "all",
      skill: options.skill ?? "all",
      maxPerRepo: 2,
    },
  );
}

export {
  recommendIssues,
  groupRecommendationsByCategory,
  getAllCuratedIssues,
  getCuratedIssueById,
  getCuratedIssueSkills,
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABEL,
  ISSUE_CATEGORY_SINGULAR,
} from "./engine";

export {
  getSavedIssueIds,
  getDismissedIssueIds,
  getServerIssueIds,
  isIssueSaved,
  isIssueDismissed,
  toggleSavedIssue,
  dismissIssue,
  undismissIssue,
  subscribeIssuePreferences,
  EMPTY_ISSUE_IDS,
} from "./preferences";
