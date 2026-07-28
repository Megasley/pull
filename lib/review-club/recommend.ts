import { listReviewClubItemsForLesson } from "@/lib/review-club/catalog";
import type { ReviewClubItem } from "@/types/review-club";

export function recommendReviewClubItems(input: {
  lessonSlug: string;
  sectionId?: string | null;
  track?: string;
  limit?: number;
}): ReviewClubItem[] {
  const matches = listReviewClubItemsForLesson(
    input.lessonSlug,
    input.sectionId,
    input.track,
  );

  return matches
    .sort((a, b) => {
      const aLessonMatch = a.lessonSlugs.includes(input.lessonSlug) ? 1 : 0;
      const bLessonMatch = b.lessonSlugs.includes(input.lessonSlug) ? 1 : 0;
      if (aLessonMatch !== bLessonMatch) {
        return bLessonMatch - aLessonMatch;
      }

      return a.estimatedMinutes - b.estimatedMinutes;
    })
    .slice(0, input.limit ?? 3);
}
