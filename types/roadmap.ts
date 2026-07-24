import type { RoadmapDifficulty, RoadmapNodeStatus } from "@/types";

export type RoadmapJsonSection = {
  id: string;
  title: string;
  description?: string;
  defaultExpanded?: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

export type RoadmapJsonNode = {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  duration?: string;
  difficulty?: RoadmapDifficulty;
  status?: RoadmapNodeStatus;
  lockedUntil?: string[];
  resources?: string[];
  project?: string;
  position: { x: number; y: number };
};

export type RoadmapJsonEdge = {
  id: string;
  source: string;
  target: string;
};

export type RoadmapJson = {
  id: string;
  title: string;
  description?: string;
  prerequisiteRoadmap?: {
    slug: string;
    message?: string;
  };
  sections: RoadmapJsonSection[];
  nodes: RoadmapJsonNode[];
  edges: RoadmapJsonEdge[];
};

export type RoadmapProgress = {
  completed: number;
  total: number;
  percentage: number;
};

export type ResolvedRoadmapNode = RoadmapJsonNode & {
  status: RoadmapNodeStatus;
};
