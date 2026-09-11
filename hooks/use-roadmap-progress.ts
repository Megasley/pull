"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  fetchRoadmapProgressAction,
  toggleLessonProgressAction,
} from "@/app/actions/progress";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  getRoadmapFromRegistry,
  isPrerequisiteRoadmapComplete,
  readStoredCompletedIds,
  writeStoredCompletedIds,
} from "@/lib/roadmap/prerequisites";
import {
  dispatchRoadmapProgressEvent,
  subscribeRoadmapProgressEvent,
} from "@/lib/storage/brand-keys";
import type { RoadmapJson } from "@/types/roadmap";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  const unsubscribeProgress = subscribeRoadmapProgressEvent(onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    unsubscribeProgress();
  };
}

function getCompletedSnapshot(slug: string, userId: string | null): string {
  if (!userId) {
    return "[]";
  }

  const stored = readStoredCompletedIds(slug, userId);
  return JSON.stringify([...(stored ?? [])].sort());
}

function getServerCompletedSnapshot(): string {
  return "[]";
}

function dispatchProgressChange(slug: string) {
  dispatchRoadmapProgressEvent({ slug });
}

export function useRoadmapProgress(slug: string, data: RoadmapJson) {
  void data;
  const { userId, ready: authReady } = useAuthSession();

  const snapshot = useSyncExternalStore(
    subscribe,
    () => getCompletedSnapshot(slug, userId),
    getServerCompletedSnapshot,
  );

  const completedIds = new Set(JSON.parse(snapshot) as string[]);

  useEffect(() => {
    if (!authReady || !userId) {
      return;
    }

    let cancelled = false;

    async function hydrateFromServer() {
      const result = await fetchRoadmapProgressAction(slug);

      if (cancelled || !result.authenticated) {
        return;
      }

      writeStoredCompletedIds(slug, new Set(result.completedNodeSlugs), userId);
      dispatchProgressChange(slug);
    }

    void hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, [authReady, slug, userId]);

  const setNodeCompleted = useCallback(
    (nodeSlug: string, completed: boolean) => {
      if (!userId) {
        return;
      }

      const current = new Set(
        JSON.parse(getCompletedSnapshot(slug, userId)) as string[],
      );
      const next = new Set(current);
      if (completed) {
        next.add(nodeSlug);
      } else {
        next.delete(nodeSlug);
      }

      writeStoredCompletedIds(slug, next, userId);
      dispatchProgressChange(slug);

      void toggleLessonProgressAction(slug, nodeSlug, completed)
        .then(async (result) => {
          if (result.ok) {
            return;
          }

          const server = await fetchRoadmapProgressAction(slug);
          if (server.authenticated) {
            writeStoredCompletedIds(slug, new Set(server.completedNodeSlugs), userId);
            dispatchProgressChange(slug);
          }
        })
        .catch(() => {
          writeStoredCompletedIds(slug, current, userId);
          dispatchProgressChange(slug);
        });
    },
    [slug, userId],
  );

  return { completedIds, setNodeCompleted };
}

export function useRoadmapUnlocked(data: RoadmapJson): boolean {
  const { userId } = useAuthSession();
  const prerequisiteSlug = data.prerequisiteRoadmap?.slug;

  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      if (!prerequisiteSlug) {
        return "true";
      }

      if (!userId) {
        return "false";
      }

      const prerequisite = getRoadmapFromRegistry(prerequisiteSlug);

      if (!prerequisite) {
        return "false";
      }

      const stored = readStoredCompletedIds(prerequisiteSlug, userId);
      const ids = new Set(stored ?? []);

      return String(isPrerequisiteRoadmapComplete(prerequisiteSlug, ids));
    },
    () => (prerequisiteSlug ? "false" : "true"),
  );

  return snapshot === "true";
}
