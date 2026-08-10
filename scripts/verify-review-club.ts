import bitcoinRoadmap from "@/content/roadmaps/bitcoin.json";
import lightningRoadmap from "@/content/roadmaps/lightning.json";
import reviewClubCatalog from "@/content/discovery/review-club.json";
import repositories from "@/content/discovery/repositories.json";
import type { ReviewClubItem } from "@/types/review-club";
import type { RoadmapJson } from "@/types/roadmap";

const items = reviewClubCatalog as ReviewClubItem[];
const repoIds = new Set(repositories.map((repo) => repo.id));

const roadmaps: { slug: string; roadmap: RoadmapJson }[] = [
  { slug: "bitcoin", roadmap: bitcoinRoadmap as RoadmapJson },
  { slug: "lightning", roadmap: lightningRoadmap as RoadmapJson },
];

const errors: string[] = [];

for (const item of items) {
  if (!repoIds.has(item.repoId)) {
    errors.push(`${item.id}: unknown repoId "${item.repoId}"`);
  }

  if (item.lessonSlugs.length === 0 && item.sectionIds.length === 0) {
    errors.push(`${item.id}: must have lessonSlugs or sectionIds`);
  }

  if (!item.url.startsWith("https://")) {
    errors.push(`${item.id}: url must be https`);
  }

  if (item.tracks.length === 0) {
    errors.push(`${item.id}: tracks must not be empty`);
  }
}

const requiredLessonsByTrack: Record<string, string[]> = {
  bitcoin: ["basics-taproot", "basics-network", "oss-review", "dev-psbt"],
  lightning: [
    "ln-channel-liquidity",
    "ln-offers",
    "ln-routing",
    "ln-contrib-code-review",
  ],
};

for (const [track, lessonSlugs] of Object.entries(requiredLessonsByTrack)) {
  const trackItems = items.filter((item) => item.tracks.includes(track));
  const lessonCoverage = new Set(trackItems.flatMap((item) => item.lessonSlugs));

  for (const lessonSlug of lessonSlugs) {
    if (!lessonCoverage.has(lessonSlug)) {
      errors.push(`[${track}] No review club items tagged for lesson: ${lessonSlug}`);
    }
  }
}

for (const { slug, roadmap } of roadmaps) {
  const trackItems = items.filter((item) => item.tracks.includes(slug));

  for (const section of roadmap.sections) {
    const hasSectionCoverage = trackItems.some((item) =>
      item.sectionIds.includes(section.id),
    );

    if (!hasSectionCoverage) {
      errors.push(`[${slug}] No review club items for section: ${section.id}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Review club verification failed:\n");
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

console.log(`Review club verification passed (${items.length} items).`);
