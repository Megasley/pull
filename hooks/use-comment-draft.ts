"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import {
  readMigratedLocalStorage,
  writePullLocalStorage,
} from "@/lib/storage/brand-keys";

const DRAFT_PREFIX = "comment-draft:";
const DRAFT_EVENT = "pull:comment-draft";

/** Builds a unique storage key per composer location (question/reply/edit). */
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

/** Persists a comment draft to localStorage via useSyncExternalStore.
 *  clearDraft resets to the initial value — call after successful post. */
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

  // editedValue takes precedence once the user types; null = use stored/initial.
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
    setEditedValue(null);
    writePullLocalStorage(keySuffix, "");
    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENT, {
        detail: { keySuffix, type: "clear" },
      }),
    );
  }, [keySuffix]);

  return { value, setValue, clearDraft };
}
