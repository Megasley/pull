export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export type LessonResourceKind =
  | "book"
  | "bip"
  | "bolt"
  | "docs"
  | "article"
  | "video"
  | "tool"
  | "interactive";

export type LessonResource = {
  title: string;
  url?: string;
  kind?: LessonResourceKind;
  chapter?: string;
  note?: string;
  /** When true, shown in the Required reading study plan (not only Resources). */
  required?: boolean;
};

export type LessonLab = {
  title: string;
  description: string;
  evidence: string[];
};

export type LessonQuizOption = {
  id: string;
  label: string;
};

export type LessonQuizQuestion = {
  id: string;
  prompt: string;
  options: LessonQuizOption[];
  correctOptionId: string;
  explanation: string;
};

export type LessonChapterQuiz = {
  id: string;
  sectionId: string;
  title: string;
  passingScore: number;
  recommendedProjects?: string[];
  questions: LessonQuizQuestion[];
};

export type LessonFrontmatter = {
  title: string;
  description: string;
  difficulty: LessonDifficulty;
  duration: string;
  objectives?: string[];
  resources?: LessonResource[] | string[];
  /** Explicit required reading; falls back to resources marked required or book/bip/bolt. */
  requiredReading?: LessonResource[] | string[];
  reflectionPrompts?: string[];
  lab?: LessonLab | null;
  /** Queries for Bitcoin Search deep-links (BIPs, topics, authors). */
  searchQueries?: string[];
  project?: string | null;
  challenge?: string;
  recommendedProjects?: string[];
};

export type TocItem = {
  id: string;
  title: string;
  depth: 2 | 3;
};

export type LessonMeta = LessonFrontmatter & {
  roadmap: string;
  slug: string;
};

export type LessonNavigation = {
  previous: LessonMeta | null;
  next: LessonMeta | null;
};

export type CompiledLesson = LessonMeta & {
  body: string;
  toc: TocItem[];
};

export function normalizeResources(
  resources: LessonFrontmatter["resources"],
): LessonResource[] {
  if (!resources) {
    return [];
  }

  return resources.map((resource) =>
    typeof resource === "string" ? { title: resource } : resource,
  );
}

export function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (typeof item === "string") {
      return item;
    }

    if (item && typeof item === "object" && !Array.isArray(item)) {
      return Object.entries(item as Record<string, unknown>)
        .map(([key, val]) =>
          val === null || val === undefined || val === ""
            ? key
            : `${key}: ${String(val)}`,
        )
        .join(", ");
    }

    return String(item);
  });
}

export function resolveRequiredReading(
  frontmatter: Pick<LessonFrontmatter, "resources" | "requiredReading">,
): LessonResource[] {
  const explicit = normalizeResources(frontmatter.requiredReading).filter(
    (item) => item.kind !== "interactive",
  );
  if (explicit.length > 0) {
    return explicit;
  }

  const resources = normalizeResources(frontmatter.resources);
  const marked = resources.filter(
    (item) => item.required && item.kind !== "interactive",
  );
  if (marked.length > 0) {
    return marked;
  }

  return resources.filter(
    (item) =>
      item.kind === "book" ||
      item.kind === "bip" ||
      item.kind === "bolt" ||
      Boolean(item.chapter),
  );
}

/** Interactive companion labs (e.g. Decoding Bitcoin modules/tools). */
export function resolveInteractiveLabs(
  frontmatter: Pick<LessonFrontmatter, "resources">,
): LessonResource[] {
  return normalizeResources(frontmatter.resources).filter(
    (item) => item.kind === "interactive",
  );
}

const BIP_OR_BOLT =
  /\b(?:BIP[-\s]?(\d{1,4})|BOLT[-\s]?(\d{1,2}))\b/gi;

/** Prefer explicit searchQueries; else harvest BIP/BOLT ids from resources; else title. */
export function resolveSearchQueries(
  frontmatter: Pick<
    LessonFrontmatter,
    "title" | "resources" | "requiredReading" | "searchQueries"
  >,
): string[] {
  const explicit = normalizeStringList(frontmatter.searchQueries)
    .map((item) => item.trim())
    .filter(Boolean);
  if (explicit.length > 0) {
    return [...new Set(explicit)];
  }

  const harvested = new Set<string>();
  const pools = [
    ...normalizeResources(frontmatter.resources),
    ...normalizeResources(frontmatter.requiredReading),
  ];

  for (const resource of pools) {
    const haystack = [resource.title, resource.chapter, resource.url, resource.note]
      .filter(Boolean)
      .join(" ");
    for (const match of haystack.matchAll(BIP_OR_BOLT)) {
      if (match[1]) {
        harvested.add(`BIP${Number.parseInt(match[1], 10)}`);
      } else if (match[2]) {
        harvested.add(`BOLT${Number.parseInt(match[2], 10)}`);
      }
    }
  }

  if (harvested.size > 0) {
    return [...harvested];
  }

  const title = frontmatter.title?.trim();
  return title ? [title] : [];
}
