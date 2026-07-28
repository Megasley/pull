export type ReviewClubItemKind = "pr_review" | "gfi" | "spec_review";

export type ReviewClubItem = {
  id: string;
  title: string;
  kind: ReviewClubItemKind;
  url: string;
  repoId: string;
  lessonSlugs: string[];
  sectionIds: string[];
  skills: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  reviewFocus: string[];
  estimatedMinutes: number;
  summary: string;
  tracks: string[];
};

export type ReviewClubCatalog = ReviewClubItem[];
