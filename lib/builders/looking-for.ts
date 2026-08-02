/** Optional “Looking For” interests on public builder profiles. */

export const LOOKING_FOR_OPTIONS = [
  {
    id: "first_oss_contribution",
    label: "First OSS Contribution",
  },
  {
    id: "bitcoin_project",
    label: "Bitcoin Project",
  },
  {
    id: "lightning_project",
    label: "Lightning Project",
  },
  {
    id: "nostr_project",
    label: "Nostr Project",
  },
  {
    id: "maintainer_mentorship",
    label: "Maintainer Mentorship",
  },
  {
    id: "volunteer_contributions",
    label: "Volunteer Contributions",
  },
  {
    id: "paid_opportunities",
    label: "Paid Opportunities",
  },
  {
    id: "not_actively_looking",
    label: "Not Actively Looking",
  },
] as const;

export type LookingForId = (typeof LOOKING_FOR_OPTIONS)[number]["id"];

const LOOKING_FOR_IDS = new Set<string>(
  LOOKING_FOR_OPTIONS.map((option) => option.id),
);

export function isLookingForId(value: string): value is LookingForId {
  return LOOKING_FOR_IDS.has(value);
}

export function normalizeLookingFor(value: unknown): LookingForId[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<LookingForId>();
  const result: LookingForId[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!isLookingForId(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function lookingForLabel(id: LookingForId): string {
  return (
    LOOKING_FOR_OPTIONS.find((option) => option.id === id)?.label ?? id
  );
}

/** Looking-for chips shown in the builders directory (excludes inactive). */
export const DIRECTORY_LOOKING_FOR_OPTIONS = LOOKING_FOR_OPTIONS.filter(
  (option) => option.id !== "not_actively_looking",
);

/** Directory skill / technology filter chips (matches against profile skills). */
export const BUILDER_DIRECTORY_FILTERS = [
  "Bitcoin",
  "Lightning",
  "Rust",
  "TypeScript",
  "Go",
  "Nostr",
  "Open Source",
  "Protocol Design",
] as const;

export type BuilderDirectoryFilter =
  (typeof BUILDER_DIRECTORY_FILTERS)[number];
