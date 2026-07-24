import bitcoinRoadmap from "@/content/roadmaps/bitcoin.json";
import lightningRoadmap from "@/content/roadmaps/lightning.json";
import { validateRoadmap } from "@/lib/roadmap/progress";
import {
  validateAllRoadmapNodesRender,
  validateBitcoinRoadmap,
  validateLightningRoadmap,
  validatePrerequisiteLogic,
} from "@/lib/roadmap/validate-complete";
import type { RoadmapJson } from "@/types/roadmap";

const roadmaps: Record<string, RoadmapJson> = {
  bitcoin: bitcoinRoadmap as RoadmapJson,
  lightning: lightningRoadmap as RoadmapJson,
};

export function getRoadmap(slug: string): RoadmapJson | null {
  const roadmap = roadmaps[slug];

  if (!roadmap) {
    return null;
  }

  if (slug === "bitcoin") {
    validateBitcoinRoadmap(roadmap);
  }

  if (slug === "lightning") {
    validateLightningRoadmap(roadmap);
    const prerequisiteIssues = validatePrerequisiteLogic(roadmap);

    if (prerequisiteIssues.length > 0) {
      throw new Error(prerequisiteIssues.join("\n"));
    }
  }

  if (slug !== "bitcoin" && slug !== "lightning") {
    validateRoadmap(roadmap);
  }

  const renderIssues = validateAllRoadmapNodesRender(roadmap);

  if (renderIssues.length > 0) {
    throw new Error(renderIssues.join("\n"));
  }

  return roadmap;
}

export function getRoadmapSlugs(): string[] {
  return Object.keys(roadmaps);
}
