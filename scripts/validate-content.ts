import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import bitcoinRoadmap from "../content/roadmaps/bitcoin.json";
import lightningRoadmap from "../content/roadmaps/lightning.json";

import { getLessonSlugs } from "@/lib/content/load-lessons";
import { normalizeResources, type LessonFrontmatter } from "@/types/content";

const roadmaps = [
  { slug: "bitcoin", data: bitcoinRoadmap },
  { slug: "lightning", data: lightningRoadmap },
] as const;

const PROJECT_PREFIXES = ["project-", "ln-project-", "oss-", "ln-contrib-"];

function isConceptLesson(slug: string) {
  return !PROJECT_PREFIXES.some((prefix) => slug.startsWith(prefix));
}

function lessonPath(roadmap: string, slug: string) {
  return path.join(process.cwd(), "content", roadmap, `${slug}.mdx`);
}

function main() {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const { slug, data } of roadmaps) {
    const lessonSlugs = new Set(getLessonSlugs(slug));
    const nodeIds = data.nodes.map((node) => node.id);

    for (const nodeId of nodeIds) {
      if (!lessonSlugs.has(nodeId)) {
        errors.push(`Missing MDX lesson: content/${slug}/${nodeId}.mdx`);
      }
    }

    for (const lessonSlug of lessonSlugs) {
      if (!nodeIds.includes(lessonSlug)) {
        errors.push(
          `Orphan MDX lesson content/${slug}/${lessonSlug}.mdx has no matching roadmap node`,
        );
      }
    }

    for (const lessonSlug of lessonSlugs) {
      const file = lessonPath(slug, lessonSlug);
      if (!fs.existsSync(file)) {
        continue;
      }

      const raw = fs.readFileSync(file, "utf8");
      const { data: frontmatter, content } = matter(raw);
      const resources = normalizeResources(
        (frontmatter as LessonFrontmatter).resources,
      );

      const richResources = resources.filter((r) => r.url || r.chapter);
      if (richResources.length < 2) {
        warnings.push(
          `${slug}/${lessonSlug}: expected ≥2 resources with url or chapter (found ${richResources.length})`,
        );
      }

      if (isConceptLesson(lessonSlug)) {
        const hasDiagram =
          content.includes("<Mermaid") || content.includes("<LessonImage");
        if (!hasDiagram) {
          warnings.push(
            `${slug}/${lessonSlug}: concept lesson missing Mermaid or LessonImage`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("Content validation failed:\n");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("Content validation warnings:\n");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  const lessonCount = roadmaps.reduce(
    (total, roadmap) => total + getLessonSlugs(roadmap.slug).length,
    0,
  );

  console.log(`Content validation passed for ${lessonCount} lessons.`);
}

main();
