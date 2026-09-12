export type XpSourceType =
  | "lesson_complete"
  | "chapter_quiz_passed"
  | "project_submitted"
  | "project_approved"
  | "merged_pr"
  | "roadmap_complete"
  | "achievement"
  | "qa_answer_accepted";

export type XpAwardResult = {
  awarded: boolean;
  amount: number;
  totalXp: number;
  level: number;
};
