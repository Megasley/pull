import {
  readMigratedLocalStorage,
  writePullLocalStorage,
} from "@/lib/storage/brand-keys";

const KEY_SUFFIX = "project-bookmarks";
const EVENT_NAME = "pull:project-bookmarks";
const LEGACY_EVENT_NAME = "builderos:project-bookmarks";

function readBookmarks(): string[] {
  try {
    const raw = readMigratedLocalStorage(KEY_SUFFIX);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeBookmarks(slugs: string[]) {
  writePullLocalStorage(KEY_SUFFIX, JSON.stringify([...new Set(slugs)]));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getBookmarkedProjectSlugs() {
  return readBookmarks();
}

export function isProjectBookmarked(slug: string) {
  return readBookmarks().includes(slug);
}

export function toggleProjectBookmark(slug: string) {
  const current = readBookmarks();
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];
  writeBookmarks(next);
  return next.includes(slug);
}

export function subscribeProjectBookmarks(onStoreChange: () => void) {
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
