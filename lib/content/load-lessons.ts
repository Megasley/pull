import { readdirSync, readFileSync } from "node:fs";

import matter from "gray-matter";

import type { LessonFrontmatter, LessonLab, LessonMeta } from "@/types/content";
import { normalizeStringList } from "@/types/content";

import { extractToc } from "./extract-toc";
import {
  getLessonFilePath,
  getRoadmapContentDir,
  lessonExists,
  ROADMAP_CONTENT_DIRS,
} from "./paths";

function normalizeLab(value: unknown): LessonLab | null | undefined {
  if (value == null) {
    return value as null | undefined;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const lab = value as Record<string, unknown>;
  const title = typeof lab.title === "string" ? lab.title : "";
  const description =
    typeof lab.description === "string" ? lab.description : "";

  if (!title) {
    return undefined;
  }

  return {
    title,
    description,
    evidence: normalizeStringList(lab.evidence),
  };
}

function parseLessonFile(roadmap: string, slug: string) {
  const filePath = getLessonFilePath(roadmap, slug);
  const source = readFileSync(filePath, "utf8");
  const { content, data } = matter(source);
  const frontmatter = data as LessonFrontmatter;
  const objectives = normalizeStringList(frontmatter.objectives);
  const reflectionPrompts = normalizeStringList(frontmatter.reflectionPrompts);
  const searchQueries = normalizeStringList(frontmatter.searchQueries);
  const lab = normalizeLab(frontmatter.lab);

  return {
    body: content.trim(),
    frontmatter: {
      ...frontmatter,
      objectives: objectives.length > 0 ? objectives : frontmatter.objectives,
      reflectionPrompts:
        reflectionPrompts.length > 0
          ? reflectionPrompts
          : frontmatter.reflectionPrompts,
      searchQueries:
        searchQueries.length > 0 ? searchQueries : frontmatter.searchQueries,
      lab: lab === undefined ? frontmatter.lab : lab,
    },
    toc: extractToc(content),
  };
}

export function getLessonSlugs(roadmap: string): string[] {
  const dir = getRoadmapContentDir(roadmap);

  try {
    return readdirSync(dir)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => file.replace(/\.mdx$/, ""))
      .sort();
  } catch {
    return [];
  }
}

export function getAllLessonSlugs(): Array<{ roadmap: string; lesson: string }> {
  return ROADMAP_CONTENT_DIRS.flatMap((roadmap) =>
    getLessonSlugs(roadmap).map((lesson) => ({ roadmap, lesson })),
  );
}

export function getLessonMeta(roadmap: string, slug: string): LessonMeta | null {
  if (!lessonExists(roadmap, slug)) {
    return null;
  }

  const { frontmatter } = parseLessonFile(roadmap, slug);

  return {
    roadmap,
    slug,
    ...frontmatter,
  };
}

export function getRoadmapLessons(roadmap: string): LessonMeta[] {
  return getLessonSlugs(roadmap)
    .map((slug) => getLessonMeta(roadmap, slug))
    .filter((lesson): lesson is LessonMeta => lesson !== null);
}

export function loadLessonSource(roadmap: string, slug: string) {
  if (!lessonExists(roadmap, slug)) {
    return null;
  }

  const { body, frontmatter, toc } = parseLessonFile(roadmap, slug);

  return {
    roadmap,
    slug,
    body,
    toc,
    ...frontmatter,
  };
}

export function getAvailableRoadmaps(): string[] {
  return [...ROADMAP_CONTENT_DIRS];
}
