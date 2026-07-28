import reviewClubCatalog from "@/content/discovery/review-club.json";
import type { ReviewClubItem } from "@/types/review-club";

const items = reviewClubCatalog as ReviewClubItem[];

export function listReviewClubItems(): ReviewClubItem[] {
  return items;
}

export function getReviewClubItem(id: string): ReviewClubItem | null {
  return items.find((item) => item.id === id) ?? null;
}

export function listReviewClubItemsForLesson(
  lessonSlug: string,
  sectionId?: string | null,
  track?: string,
): ReviewClubItem[] {
  return items.filter((item) => {
    if (track && !item.tracks.includes(track)) {
      return false;
    }

    if (item.lessonSlugs.includes(lessonSlug)) {
      return true;
    }

    if (sectionId && item.sectionIds.includes(sectionId)) {
      return true;
    }

    return false;
  });
}
