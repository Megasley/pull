"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import {
  readMigratedLocalStorage,
  writePullLocalStorage,
} from "@/lib/storage/brand-keys";

const DRAFT_PREFIX = "comment-draft:";
const DRAFT_EVENT = "pull:comment-draft";

/**
 * Builds a stable storage key suffix unique to a comment composer location.
 *
 * - Questions: keyed by entity type + identifying slugs
 * - Replies: keyed by thread id
 * - Edits: keyed by comment id
 *
 * Two different users editing different roadmap steps, or the same user
 * editing a question vs. a reply, never collide.
 */
export function draftKeySuffix(
  location:
    | { kind: "question"; entityKey: string }
    | { kind: "reply"; threadId: string }
    | { kind: "edit"; commentId: string },
): string {
  if (location.kind === "reply") {
    return `${DRAFT_PREFIX}reply:${location.threadId}`;
  }
  if (location.kind === "edit") {
    return `${DRAFT_PREFIX}edit:${location.commentId}`;
  }
  return `${DRAFT_PREFIX}question:${location.entityKey}`;
}

/**
 * Build an entity-unique key for a question composer from the same
 * CommentEntityInput the composer receives.
 */
export function questionEntityKey(entity: {
  entityType: string;
  projectSlug?: string;
  roadmapSlug?: string;
  roadmapNodeSlug?: string;
  developerToolSlug?: string;
}): string {
  if (entity.entityType === "project") {
    return `project:${entity.projectSlug ?? ""}`;
  }
  if (entity.entityType === "roadmap_step") {
    return `roadmap:${entity.roadmapSlug ?? ""}:${entity.roadmapNodeSlug ?? ""}`;
  }
  return `tool:${entity.developerToolSlug ?? ""}`;
}

function subscribeToStorage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(DRAFT_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(DRAFT_EVENT, handler);
  };
}

/**
 * Persists a comment draft to localStorage so it survives page refreshes.
 *
 * Uses `useSyncExternalStore` to read the initial draft value — this is
 * React's built-in primitive for external stores, which handles SSR
 * hydration correctly without `setState`-in-`useEffect`.
 *
 * - On the server: returns the `initial` value (no localStorage access).
 * - On client hydration: returns the server value, then immediately
 *   re-renders with the stored draft if one exists.
 * - On every user edit: writes to localStorage immediately.
 * - `clearDraft` removes the entry — call after a successful post/reply/edit.
 */
export function useCommentDraft(
  keySuffix: string,
  initial: string = "",
): {
  value: string;
  setValue: (next: string) => void;
  clearDraft: () => void;
} {
  const getSnapshot = useCallback(() => {
    return readMigratedLocalStorage(keySuffix) ?? "";
  }, [keySuffix]);

  const getServerSnapshot = useCallback(() => "", []);

  const storedValue = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot,
  );

  // Once the user starts typing, their edits take precedence over the
  // stored value. `null` means "no manual edit yet — use stored/initial".
  // Note: `||` (not `??`) is used between storedValue and initial because
  // an empty string from localStorage (no draft saved) should fall through
  // to the initial value. `editedValue` uses `??` because an empty string
  // there means the user explicitly cleared the draft.
  const [editedValue, setEditedValue] = useState<string | null>(null);

  const value = editedValue ?? (storedValue || initial);

  const setValue = useCallback(
    (next: string) => {
      setEditedValue(next);
      writePullLocalStorage(keySuffix, next);
    },
    [keySuffix],
  );

  const clearDraft = useCallback(() => {
    setEditedValue("");
    writePullLocalStorage(keySuffix, "");
    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENT, {
        detail: { keySuffix, type: "clear" },
      }),
    );
  }, [keySuffix]);

  return { value, setValue, clearDraft };
}
