import {
  readMigratedLocalStorage,
  writePullLocalStorage,
} from "@/lib/storage/brand-keys";

const KEY_SUFFIX = "discovery-bookmarks";
const EVENT_NAME = "pull:discovery-bookmarks";
const LEGACY_EVENT_NAME = "builderos:discovery-bookmarks";

/** Stable empty snapshot for SSR / useSyncExternalStore. */
export const EMPTY_DISCOVERY_BOOKMARKS: string[] = [];

let cachedSnapshot: string[] = EMPTY_DISCOVERY_BOOKMARKS;
let cachedSerialized = "[]";

function readBookmarks(): string[] {
  try {
    const raw = readMigratedLocalStorage(KEY_SUFFIX);
    if (!raw) return EMPTY_DISCOVERY_BOOKMARKS;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : EMPTY_DISCOVERY_BOOKMARKS;
  } catch {
    return EMPTY_DISCOVERY_BOOKMARKS;
  }
}

function writeBookmarks(ids: string[]) {
  const unique = [...new Set(ids)];
  writePullLocalStorage(KEY_SUFFIX, JSON.stringify(unique));
  cachedSerialized = JSON.stringify(unique);
  cachedSnapshot = unique.length === 0 ? EMPTY_DISCOVERY_BOOKMARKS : unique;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/**
 * Cached snapshot - same array reference when contents are unchanged.
 * Required for useSyncExternalStore to avoid infinite re-renders.
 */
export function getBookmarkedDiscoveryIds() {
  const next = readBookmarks();
  const serialized = JSON.stringify(next);
  if (serialized === cachedSerialized) {
    return cachedSnapshot;
  }
  cachedSerialized = serialized;
  cachedSnapshot = next.length === 0 ? EMPTY_DISCOVERY_BOOKMARKS : next;
  return cachedSnapshot;
}

export function getServerDiscoveryBookmarks() {
  return EMPTY_DISCOVERY_BOOKMARKS;
}

export function isDiscoveryBookmarked(id: string) {
  return getBookmarkedDiscoveryIds().includes(id);
}

export function toggleDiscoveryBookmark(id: string) {
  const current = getBookmarkedDiscoveryIds();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  writeBookmarks(next);
  return next.includes(id);
}

export function subscribeDiscoveryBookmarks(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener(LEGACY_EVENT_NAME, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener(LEGACY_EVENT_NAME, handler);
  };
}
