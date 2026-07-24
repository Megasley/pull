import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { getAllProjects, getProjectBySlug } from "@/lib/projects/catalog";
import type {
  ProjectCatalogItem,
  ProjectSpec,
  ProjectSpecFrontmatter,
} from "@/types/project";

const SPECS_DIR = path.join(process.cwd(), "content/projects/specs");

function getSpecPath(slug: string) {
  return path.join(SPECS_DIR, `${slug}.mdx`);
}

export function projectSpecExists(slug: string) {
  return existsSync(getSpecPath(slug));
}

function parseSpecFile(slug: string): {
  overview: string;
  frontmatter: ProjectSpecFrontmatter;
} {
  const source = readFileSync(getSpecPath(slug), "utf8");
  const { content, data } = matter(source);

  return {
    overview: content.trim(),
    frontmatter: data as ProjectSpecFrontmatter,
  };
}

export function loadProjectSpec(slug: string): ProjectSpec | null {
  const catalogItem = getProjectBySlug(slug);

  if (!catalogItem || !projectSpecExists(slug)) {
    return null;
  }

  const { overview, frontmatter } = parseSpecFile(slug);

  return {
    ...catalogItem,
    ...frontmatter,
    overview,
  };
}

export function getAllProjectSpecs(): ProjectSpec[] {
  return getAllProjects()
    .map((project) => loadProjectSpec(project.slug))
    .filter((spec): spec is ProjectSpec => spec !== null);
}

export function getCatalogWithSpecAvailability(): Array<
  ProjectCatalogItem & { hasSpec: boolean }
> {
  return getAllProjects().map((project) => ({
    ...project,
    hasSpec: projectSpecExists(project.slug),
  }));
}
