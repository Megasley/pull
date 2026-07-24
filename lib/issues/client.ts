import type {
  IssueCategory,
  IssueRecommendationContext,
} from "@/types/issues";

import { recommendIssues } from "./engine";

/** Client-safe re-ranker (no DB imports). */
export function rankIssuesForClient(
  context: IssueRecommendationContext,
  prefs: { savedIssueIds: string[]; dismissedIssueIds: string[] },
  category: IssueCategory | "all" = "all",
) {
  return recommendIssues(
    {
      ...context,
      savedIssueIds: prefs.savedIssueIds,
      dismissedIssueIds: prefs.dismissedIssueIds,
    },
    { limit: 18, category, maxPerRepo: 2 },
  );
}

export {
  recommendIssues,
  groupRecommendationsByCategory,
  getAllCuratedIssues,
  getCuratedIssueById,
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
