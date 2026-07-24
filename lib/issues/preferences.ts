import {
  readMigratedLocalStorage,
  writePullLocalStorage,
} from "@/lib/storage/brand-keys";

const SAVED_SUFFIX = "issue-saved";
const DISMISSED_SUFFIX = "issue-dismissed";
const EVENT_NAME = "pull:issue-preferences";
const LEGACY_EVENT_NAME = "builderos:issue-preferences";

export const EMPTY_ISSUE_IDS: string[] = [];

type PrefKind = "saved" | "dismissed";

const cache: Record<PrefKind, { serialized: string; snapshot: string[] }> = {
  saved: { serialized: "[]", snapshot: EMPTY_ISSUE_IDS },
  dismissed: { serialized: "[]", snapshot: EMPTY_ISSUE_IDS },
};

function storageSuffix(kind: PrefKind) {
  return kind === "saved" ? SAVED_SUFFIX : DISMISSED_SUFFIX;
}

function readIds(kind: PrefKind): string[] {
  try {
    const raw = readMigratedLocalStorage(storageSuffix(kind));
    if (!raw) return EMPTY_ISSUE_IDS;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : EMPTY_ISSUE_IDS;
  } catch {
    return EMPTY_ISSUE_IDS;
  }
}

function writeIds(kind: PrefKind, ids: string[]) {
  const unique = [...new Set(ids)];
  writePullLocalStorage(storageSuffix(kind), JSON.stringify(unique));
  cache[kind].serialized = JSON.stringify(unique);
  cache[kind].snapshot = unique.length === 0 ? EMPTY_ISSUE_IDS : unique;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function getCachedIds(kind: PrefKind): string[] {
  const next = readIds(kind);
  const serialized = JSON.stringify(next);
  if (serialized === cache[kind].serialized) {
    return cache[kind].snapshot;
  }
  cache[kind].serialized = serialized;
  cache[kind].snapshot = next.length === 0 ? EMPTY_ISSUE_IDS : next;
  return cache[kind].snapshot;
}

export function getSavedIssueIds() {
  return getCachedIds("saved");
}

export function getDismissedIssueIds() {
  return getCachedIds("dismissed");
}

export function getServerIssueIds() {
  return EMPTY_ISSUE_IDS;
}

export function isIssueSaved(id: string) {
  return getSavedIssueIds().includes(id);
}

export function isIssueDismissed(id: string) {
  return getDismissedIssueIds().includes(id);
}

export function toggleSavedIssue(id: string) {
  const current = getSavedIssueIds();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  writeIds("saved", next);

  // Saving an issue clears dismissal.
  if (next.includes(id)) {
    writeIds(
      "dismissed",
      getDismissedIssueIds().filter((item) => item !== id),
    );
  }

  return next.includes(id);
}

export function dismissIssue(id: string) {
  const dismissed = getDismissedIssueIds();
  if (!dismissed.includes(id)) {
    writeIds("dismissed", [...dismissed, id]);
  }
  // Dismissing removes from saved.
  writeIds(
    "saved",
    getSavedIssueIds().filter((item) => item !== id),
  );
}

export function undismissIssue(id: string) {
  writeIds(
    "dismissed",
    getDismissedIssueIds().filter((item) => item !== id),
  );
}

export function subscribeIssuePreferences(onStoreChange: () => void) {
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
