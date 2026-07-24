import bitcoinRoadmap from "@/content/roadmaps/bitcoin.json";
import lightningRoadmap from "@/content/roadmaps/lightning.json";
import {
  dispatchRoadmapProgressEvent,
  LEGACY_STORAGE_PREFIX,
  PULL_STORAGE_PREFIX,
} from "@/lib/storage/brand-keys";
import type { RoadmapJson } from "@/types/roadmap";

export const roadmapRegistry: Record<string, RoadmapJson> = {
  bitcoin: bitcoinRoadmap as RoadmapJson,
  lightning: lightningRoadmap as RoadmapJson,
};

export function getRoadmapFromRegistry(slug: string): RoadmapJson | null {
  return roadmapRegistry[slug] ?? null;
}

const ROADMAP_PROGRESS_PREFIX = `${PULL_STORAGE_PREFIX}roadmap-progress:`;
const LEGACY_ROADMAP_PROGRESS_PREFIX = `${LEGACY_STORAGE_PREFIX}roadmap-progress:`;

/** @deprecated Legacy unscoped key - cleared on logout / migrated once. */
export const ROADMAP_PROGRESS_STORAGE_KEY = (slug: string) =>
  `${ROADMAP_PROGRESS_PREFIX}${slug}`;

export const ROADMAP_PROGRESS_USER_STORAGE_KEY = (userId: string, slug: string) =>
  `${ROADMAP_PROGRESS_PREFIX}${userId}:${slug}`;

function legacyUserStorageKey(userId: string, slug: string) {
  return `${LEGACY_ROADMAP_PROGRESS_PREFIX}${userId}:${slug}`;
}

function parseCompletedIds(stored: string | null): string[] | null {
  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : null;
  } catch {
    return null;
  }
}

function migrateRoadmapProgressKey(nextKey: string, legacyKey: string): string | null {
  const current = window.localStorage.getItem(nextKey);
  if (current !== null) {
    return current;
  }

  const legacy = window.localStorage.getItem(legacyKey);
  if (legacy === null) {
    return null;
  }

  window.localStorage.setItem(nextKey, legacy);
  window.localStorage.removeItem(legacyKey);
  return legacy;
}

export function readStoredCompletedIds(
  slug: string,
  userId?: string | null,
): string[] | null {
  if (typeof window === "undefined" || !userId) {
    return null;
  }

  const nextKey = ROADMAP_PROGRESS_USER_STORAGE_KEY(userId, slug);
  const legacyKey = legacyUserStorageKey(userId, slug);
  return parseCompletedIds(migrateRoadmapProgressKey(nextKey, legacyKey));
}

export function writeStoredCompletedIds(
  slug: string,
  completedIds: Set<string>,
  userId?: string | null,
): void {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  const nextKey = ROADMAP_PROGRESS_USER_STORAGE_KEY(userId, slug);
  const legacyKey = legacyUserStorageKey(userId, slug);
  window.localStorage.setItem(nextKey, JSON.stringify([...completedIds]));
  window.localStorage.removeItem(legacyKey);
}

function collectKeysWithPrefixes(prefixes: string[]): string[] {
  const keys: string[] = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keys.push(key);
    }
  }

  return keys;
}

/** Removes pre-auth unscoped caches like `pull:roadmap-progress:bitcoin`. */
export function clearLegacyUnscopedRoadmapProgress(): void {
  if (typeof window === "undefined") {
    return;
  }

  const keys = collectKeysWithPrefixes([
    ROADMAP_PROGRESS_PREFIX,
    LEGACY_ROADMAP_PROGRESS_PREFIX,
  ]).filter((key) => {
    const prefix = key.startsWith(ROADMAP_PROGRESS_PREFIX)
      ? ROADMAP_PROGRESS_PREFIX
      : LEGACY_ROADMAP_PROGRESS_PREFIX;
    const rest = key.slice(prefix.length);
    // Scoped keys are `${userId}:${slug}`; legacy keys are just `${slug}`.
    return !rest.includes(":");
  });

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

/** Clears all roadmap progress caches (scoped + legacy). Call on sign-out. */
export function clearAllStoredRoadmapProgress(): void {
  if (typeof window === "undefined") {
    return;
  }

  const keys = collectKeysWithPrefixes([
    ROADMAP_PROGRESS_PREFIX,
    LEGACY_ROADMAP_PROGRESS_PREFIX,
  ]);

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }

  dispatchRoadmapProgressEvent();
}

export function isPrerequisiteRoadmapComplete(
  prerequisiteSlug: string,
  completedIds: Set<string>,
): boolean {
  const prerequisite = getRoadmapFromRegistry(prerequisiteSlug);

  if (!prerequisite) {
    return false;
  }

  return prerequisite.nodes.every((node) => completedIds.has(node.id));
}

export function isRoadmapUnlocked(
  data: RoadmapJson,
  completedIdsBySlug: (slug: string) => Set<string>,
): boolean {
  if (!data.prerequisiteRoadmap) {
    return true;
  }

  const prerequisiteCompleted = completedIdsBySlug(data.prerequisiteRoadmap.slug);
  return isPrerequisiteRoadmapComplete(
    data.prerequisiteRoadmap.slug,
    prerequisiteCompleted,
  );
}
