/** New brand storage namespace. */
export const PULL_STORAGE_PREFIX = "pull:";

/** Legacy BuilderOS storage namespace (read once, then migrate). */
export const LEGACY_STORAGE_PREFIX = "builderos:";

/**
 * Read a localStorage value from the Pull key, falling back to the legacy
 * BuilderOS key and copying it forward when found.
 */
export function readMigratedLocalStorage(keySuffix: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const nextKey = `${PULL_STORAGE_PREFIX}${keySuffix}`;
  const legacyKey = `${LEGACY_STORAGE_PREFIX}${keySuffix}`;
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

export function writePullLocalStorage(keySuffix: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextKey = `${PULL_STORAGE_PREFIX}${keySuffix}`;
  const legacyKey = `${LEGACY_STORAGE_PREFIX}${keySuffix}`;
  window.localStorage.setItem(nextKey, value);
  window.localStorage.removeItem(legacyKey);
}

/**
 * Read sessionStorage with the same Pull / legacy migration behavior.
 */
export function readMigratedSessionStorage(keySuffix: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const nextKey = `${PULL_STORAGE_PREFIX}${keySuffix}`;
  const legacyKey = `${LEGACY_STORAGE_PREFIX}${keySuffix}`;
  const current = window.sessionStorage.getItem(nextKey);

  if (current !== null) {
    return current;
  }

  const legacy = window.sessionStorage.getItem(legacyKey);
  if (legacy === null) {
    return null;
  }

  window.sessionStorage.setItem(nextKey, legacy);
  window.sessionStorage.removeItem(legacyKey);
  return legacy;
}

export function writePullSessionStorage(keySuffix: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextKey = `${PULL_STORAGE_PREFIX}${keySuffix}`;
  const legacyKey = `${LEGACY_STORAGE_PREFIX}${keySuffix}`;
  window.sessionStorage.setItem(nextKey, value);
  window.sessionStorage.removeItem(legacyKey);
}

export const ROADMAP_PROGRESS_EVENT = "pull:roadmap-progress";
export const LEGACY_ROADMAP_PROGRESS_EVENT = "builderos:roadmap-progress";

export function subscribeRoadmapProgressEvent(handler: () => void): () => void {
  window.addEventListener(ROADMAP_PROGRESS_EVENT, handler);
  window.addEventListener(LEGACY_ROADMAP_PROGRESS_EVENT, handler);
  return () => {
    window.removeEventListener(ROADMAP_PROGRESS_EVENT, handler);
    window.removeEventListener(LEGACY_ROADMAP_PROGRESS_EVENT, handler);
  };
}

export function dispatchRoadmapProgressEvent(detail?: { slug: string }): void {
  window.dispatchEvent(new CustomEvent(ROADMAP_PROGRESS_EVENT, { detail }));
}
