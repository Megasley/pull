import bitcoinRoadmap from "../content/roadmaps/bitcoin.json";
import lightningRoadmap from "../content/roadmaps/lightning.json";
import { calculateRoadmapProgress } from "../lib/roadmap/progress";
import { isPrerequisiteRoadmapComplete } from "../lib/roadmap/prerequisites";
import {
  validateBitcoinRoadmap,
  validateLightningRoadmap,
  validatePrerequisiteLogic,
} from "../lib/roadmap/validate-complete";
import type { RoadmapJson } from "../types/roadmap";

const roadmaps: Record<string, RoadmapJson> = {
  bitcoin: bitcoinRoadmap as RoadmapJson,
  lightning: lightningRoadmap as RoadmapJson,
};

function main() {
  console.log("Validating Pull roadmaps...\n");

  for (const [slug, roadmap] of Object.entries(roadmaps)) {
    if (slug === "bitcoin") {
      validateBitcoinRoadmap(roadmap);
    }

    if (slug === "lightning") {
      validateLightningRoadmap(roadmap);
      const issues = validatePrerequisiteLogic(roadmap);

      if (issues.length > 0) {
        throw new Error(issues.join("\n"));
      }
    }

    const completedIds = new Set(
      roadmap.nodes
        .filter((node) => node.status === "completed")
        .map((node) => node.id),
    );
    const progress = calculateRoadmapProgress(roadmap.nodes, completedIds);

    console.log(`✓ ${roadmap.title}`);
    console.log(`  Sections: ${roadmap.sections.length}`);
    console.log(`  Nodes: ${roadmap.nodes.length}`);
    console.log(`  Edges: ${roadmap.edges.length}`);
    console.log(
      `  Initial progress: ${progress.percentage}% (${progress.completed}/${progress.total})`,
    );

    if (roadmap.prerequisiteRoadmap) {
      const unlocked = isPrerequisiteRoadmapComplete(
        roadmap.prerequisiteRoadmap.slug,
        new Set<string>(),
      );
      console.log(
        `  Prerequisite "${roadmap.prerequisiteRoadmap.slug}" complete: ${unlocked}`,
      );
    }

    console.log();
  }

  console.log("All roadmaps valid.");
}

main();
