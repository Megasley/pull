import { existsSync } from "node:fs";
import { join } from "node:path";

export const CONTENT_ROOT = join(process.cwd(), "content");

export const ROADMAP_CONTENT_DIRS = ["bitcoin", "lightning"] as const;

export type RoadmapContentSlug = (typeof ROADMAP_CONTENT_DIRS)[number];

export function getRoadmapContentDir(roadmap: string): string {
  return join(CONTENT_ROOT, roadmap);
}

export function getLessonFilePath(roadmap: string, slug: string): string {
  return join(getRoadmapContentDir(roadmap), `${slug}.mdx`);
}

export function lessonExists(roadmap: string, slug: string): boolean {
  return existsSync(getLessonFilePath(roadmap, slug));
}
