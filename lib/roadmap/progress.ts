import type { RoadmapJson, RoadmapJsonNode, RoadmapProgress } from "@/types/roadmap";
import type { RoadmapNodeStatus } from "@/types";

export function isNodeLockedByPrerequisites(
  node: RoadmapJsonNode,
  completedIds: Set<string>,
): boolean {
  if (!node.lockedUntil?.length) {
    return false;
  }

  return !node.lockedUntil.every((id) => completedIds.has(id));
}

export function resolveNodeStatuses(
  nodes: RoadmapJsonNode[],
  completedIds: Set<string>,
  options?: { roadmapLocked?: boolean; freeBrowse?: boolean },
): Map<string, RoadmapNodeStatus> {
  const statuses = new Map<string, RoadmapNodeStatus>();

  if (options?.freeBrowse) {
    for (const node of nodes) {
      statuses.set(node.id, completedIds.has(node.id) ? "completed" : "default");
    }

    let activeAssigned = false;
    for (const node of nodes) {
      if (statuses.get(node.id) === "default" && !activeAssigned) {
        statuses.set(node.id, "active");
        activeAssigned = true;
      }
    }

    return statuses;
  }

  if (options?.roadmapLocked) {
    for (const node of nodes) {
      statuses.set(node.id, "locked");
    }
    return statuses;
  }

  for (const node of nodes) {
    // Progress store is the source of truth - ignore JSON "completed" for display.
    if (completedIds.has(node.id)) {
      statuses.set(node.id, "completed");
      continue;
    }

    if (node.status === "locked" || isNodeLockedByPrerequisites(node, completedIds)) {
      statuses.set(node.id, "locked");
      continue;
    }

    statuses.set(node.id, "default");
  }

  let activeAssigned = false;

  for (const node of nodes) {
    const status = statuses.get(node.id);

    if (status === "default" && !activeAssigned) {
      statuses.set(node.id, "active");
      activeAssigned = true;
    }
  }

  return statuses;
}

export function calculateRoadmapProgress(
  nodes: RoadmapJsonNode[],
  completedIds: Set<string>,
): RoadmapProgress {
  const total = nodes.length;
  const completed = nodes.filter((node) => completedIds.has(node.id)).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

/** Fresh progress starts empty. Completion only comes from user actions / synced DB. */
export function getInitialCompletedIds(_data: RoadmapJson): Set<string> {
  return new Set();
}

export function getInitialExpandedSections(data: RoadmapJson): Set<string> {
  return new Set(
    data.sections
      .filter((section) => section.defaultExpanded !== false)
      .map((section) => section.id),
  );
}

export function validateRoadmap(data: RoadmapJson): void {
  const sectionIds = new Set(data.sections.map((section) => section.id));
  const nodeIds = new Set(data.nodes.map((node) => node.id));

  for (const node of data.nodes) {
    if (!sectionIds.has(node.sectionId)) {
      throw new Error(
        `Node "${node.id}" references unknown section "${node.sectionId}".`,
      );
    }

    for (const prerequisite of node.lockedUntil ?? []) {
      if (!nodeIds.has(prerequisite)) {
        throw new Error(
          `Node "${node.id}" references unknown prerequisite "${prerequisite}".`,
        );
      }
    }
  }

  for (const edge of data.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Edge "${edge.id}" references unknown node(s).`);
    }
  }
}
