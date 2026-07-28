import type { XpSourceType } from "@/types/xp";

export const XP_PER_LEVEL = 250;

export const XP_REWARDS: Record<XpSourceType, number> = {
  lesson_complete: 25,
  chapter_quiz_passed: 15,
  project_submitted: 50,
  project_approved: 150,
  merged_pr: 100,
  roadmap_complete: 200,
  achievement: 0, // amount comes from achievement.xpReward
};

export function lessonXpKey(roadmapSlug: string, nodeSlug: string) {
  return `${roadmapSlug}:${nodeSlug}`;
}

export function chapterQuizXpKey(roadmapSlug: string, quizId: string) {
  return `${roadmapSlug}:${quizId}`;
}

export function roadmapXpKey(roadmapSlug: string) {
  return roadmapSlug;
}

export function submissionXpKey(submissionId: string) {
  return submissionId;
}

export function achievementXpKey(slug: string) {
  return slug;
}
