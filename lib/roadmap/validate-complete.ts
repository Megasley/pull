import type { RoadmapJson } from "@/types/roadmap";

import { validateRoadmap } from "./progress";

function validateRoadmapNodeFields(
  data: RoadmapJson,
  projectSectionIds: string[],
): void {
  for (const node of data.nodes) {
    const missingFields: string[] = [];

    if (!node.description) missingFields.push("description");
    if (!node.duration) missingFields.push("duration");
    if (!node.difficulty) missingFields.push("difficulty");
    if (!node.resources?.length) missingFields.push("resources");

    if (projectSectionIds.includes(node.sectionId) && !node.project) {
      missingFields.push("project");
    }

    if (missingFields.length > 0) {
      throw new Error(`Node "${node.id}" is missing: ${missingFields.join(", ")}.`);
    }
  }
}

export function validateBitcoinRoadmap(data: RoadmapJson): void {
  validateRoadmap(data);

  const sectionTitles = new Set(data.sections.map((section) => section.title));

  for (const requiredSection of [
    "Foundations",
    "Bitcoin Basics",
    "Protocol Depth",
    "Development",
    "Projects",
    "Open Source",
  ]) {
    if (!sectionTitles.has(requiredSection)) {
      throw new Error(`Roadmap is missing required section "${requiredSection}".`);
    }
  }

  validateRoadmapNodeFields(data, ["projects"]);

  if (data.nodes.length < 20) {
    throw new Error("Bitcoin roadmap V1 requires at least 20 nodes.");
  }
}

export function validateLightningRoadmap(data: RoadmapJson): void {
  validateRoadmap(data);

  if (data.prerequisiteRoadmap?.slug !== "bitcoin") {
    throw new Error('Lightning roadmap must require the "bitcoin" roadmap.');
  }

  const sectionTitles = new Set(data.sections.map((section) => section.title));

  for (const requiredSection of [
    "Lightning Basics",
    "Channels & HTLCs",
    "Routing & Liquidity",
    "Implementation",
    "Projects",
    "Contribution",
  ]) {
    if (!sectionTitles.has(requiredSection)) {
      throw new Error(`Roadmap is missing required section "${requiredSection}".`);
    }
  }

  const requiredTopics = [
    "Lightning Overview",
    "Invoices",
    "LNURL",
    "Opening Channels",
    "HTLC Mechanics",
    "Routing",
    "Liquidity",
    "LND",
    "Core Lightning",
    "LDK",
  ];
  const nodeTitles = new Set(data.nodes.map((node) => node.title));

  for (const topic of requiredTopics) {
    if (!nodeTitles.has(topic)) {
      throw new Error(`Lightning roadmap is missing required topic "${topic}".`);
    }
  }

  validateRoadmapNodeFields(data, ["projects"]);

  if (data.nodes.length < 17) {
    throw new Error("Lightning roadmap requires at least 17 nodes.");
  }
}

/** @deprecated Use validateBitcoinRoadmap */
export const validateCompleteRoadmap = validateBitcoinRoadmap;

export function validateAllRoadmapNodesRender(data: RoadmapJson): string[] {
  const issues: string[] = [];
  const sectionIds = new Set(data.sections.map((section) => section.id));

  for (const node of data.nodes) {
    if (!sectionIds.has(node.sectionId)) {
      issues.push(`Node "${node.id}" has invalid sectionId "${node.sectionId}".`);
    }

    if (node.position.x < 0 || node.position.y < 0) {
      issues.push(`Node "${node.id}" has invalid position.`);
    }
  }

  return issues;
}

export function validatePrerequisiteLogic(data: RoadmapJson): string[] {
  const issues: string[] = [];

  if (!data.prerequisiteRoadmap) {
    return issues;
  }

  if (data.prerequisiteRoadmap.slug !== "bitcoin") {
    issues.push(`Unexpected prerequisite slug "${data.prerequisiteRoadmap.slug}".`);
  }

  const lockedNodes = data.nodes.filter((node) => node.status === "locked");

  if (lockedNodes.length > 0) {
    issues.push(
      "Lightning nodes should not use static locked status; use prerequisiteRoadmap instead.",
    );
  }

  return issues;
}
