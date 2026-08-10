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

/**
 * YAML turns unquoted `Label: details` list items into objects.
 * Coerce those back into display strings so React never receives plain objects.
 */
export function stringifyYamlListItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const entries = Object.entries(item as Record<string, unknown>);
    if (entries.length === 1) {
      const [key, value] = entries[0];
      if (value == null || value === "") return key;
      return `${key}: ${String(value)}`;
    }
  }
  return String(item ?? "");
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(stringifyYamlListItem);
}

function parseSpecFile(slug: string): {
  overview: string;
  frontmatter: ProjectSpecFrontmatter;
} {
  const source = readFileSync(getSpecPath(slug), "utf8");
  const { content, data } = matter(source);
  const raw = data as Partial<ProjectSpecFrontmatter>;

  return {
    overview: content.trim(),
    frontmatter: {
      objectives: asStringList(raw.objectives),
      architecture: typeof raw.architecture === "string" ? raw.architecture : "",
      requirements: asStringList(raw.requirements),
      stretchGoals: asStringList(raw.stretchGoals),
      resources: Array.isArray(raw.resources) ? raw.resources : [],
      exampleRepos: Array.isArray(raw.exampleRepos) ? raw.exampleRepos : [],
      submission: asStringList(raw.submission),
    },
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
