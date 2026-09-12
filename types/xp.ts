export type XpSourceType =
  | "lesson_complete"
  | "chapter_quiz_passed"
  | "project_submitted"
  | "project_approved"
  | "merged_pr"
  | "roadmap_complete"
  | "achievement"
  | "qa_answer_accepted"
  | "pr_review_completed";

export type XpAwardResult = {
  awarded: boolean;
  amount: number;
  totalXp: number;
  level: number;
};
