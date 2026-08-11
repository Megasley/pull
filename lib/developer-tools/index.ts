import { developerTools } from "@/lib/developer-tools/data";
import type {
  DeveloperTool,
  DeveloperToolCategory,
  DeveloperToolFilter,
} from "@/lib/developer-tools/types";

/** Temporary catalog scope — expand when more categories go live. */
const PUBLISHED_CATEGORIES = new Set<DeveloperToolCategory>(["APIs", "SDKs"]);

function isPublished(tool: DeveloperTool): boolean {
  return PUBLISHED_CATEGORIES.has(tool.category);
}

const publishedTools = developerTools.filter(isPublished);

export function listDeveloperTools(): DeveloperTool[] {
  return [...publishedTools].sort((a, b) => {
    if (a.featuredPartner !== b.featuredPartner) {
      return a.featuredPartner ? -1 : 1;
    }
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function listFeaturedPartners(): DeveloperTool[] {
  const preferredOrder = ["blink-api", "breez-sdk", "voltage", "ibex"];
  return publishedTools
    .filter((tool) => tool.featuredPartner)
    .sort((a, b) => {
      const ai = preferredOrder.indexOf(a.id);
      const bi = preferredOrder.indexOf(b.id);
      const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      if (aRank !== bRank) return aRank - bRank;
      return a.name.localeCompare(b.name);
    });
}

export function getDeveloperToolsPageStats() {
  const tools = publishedTools.length;
  const categories = new Set(publishedTools.map((tool) => tool.category)).size;
  return {
    toolsLabel: `${tools}+ Tools`,
    categoriesLabel: `${categories}+ Categories`,
    cadenceLabel: "Growing Weekly",
  };
}

export function listDeveloperToolSlugs(): string[] {
  return publishedTools.map((tool) => tool.slug);
}

export function listPublishedDeveloperToolCategories(): DeveloperToolCategory[] {
  return [...new Set(publishedTools.map((tool) => tool.category))].sort();
}

export function getDeveloperToolBySlug(slug: string): DeveloperTool | null {
  return publishedTools.find((tool) => tool.slug === slug) ?? null;
}

export function filterDeveloperTools(input: {
  query?: string;
  category?: DeveloperToolFilter;
}): DeveloperTool[] {
  const q = input.query?.trim().toLowerCase() ?? "";
  const category = input.category ?? "All";

  return listDeveloperTools().filter((tool) => {
    if (category !== "All" && tool.category !== category) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      tool.name,
      tool.description,
      tool.category,
      ...tool.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export {
  DEVELOPER_TOOL_CATEGORIES,
  DEVELOPER_TOOL_DIFFICULTIES,
} from "@/lib/developer-tools/types";

export type {
  DeveloperTool,
  DeveloperToolCategory,
  DeveloperToolDifficulty,
  DeveloperToolFilter,
  DeveloperToolsPageStats,
} from "@/lib/developer-tools/types";
