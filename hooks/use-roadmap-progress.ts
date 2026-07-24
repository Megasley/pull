"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  fetchRoadmapProgressAction,
  mergeRoadmapProgressAction,
  replaceRoadmapProgressAction,
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
      const localIds = readStoredCompletedIds(slug, userId) ?? [];
      const result = await fetchRoadmapProgressAction(slug);

      if (cancelled || !result.authenticated) {
        return;
      }

      const merged = [...new Set([...localIds, ...result.completedNodeSlugs])].sort();

      writeStoredCompletedIds(slug, new Set(merged), userId);
      dispatchProgressChange(slug);

      const localHasExtra = localIds.some(
        (nodeId) => !result.completedNodeSlugs.includes(nodeId),
      );

      if (localHasExtra || merged.length !== result.completedNodeSlugs.length) {
        await mergeRoadmapProgressAction(slug, merged);
      }
    }

    void hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, [authReady, slug, userId]);

  const setCompletedIds = useCallback(
    (updater: Set<string> | ((current: Set<string>) => Set<string>)) => {
      if (!userId) {
        return;
      }

      const current = new Set(
        JSON.parse(getCompletedSnapshot(slug, userId)) as string[],
      );
      const next = typeof updater === "function" ? updater(current) : updater;

      writeStoredCompletedIds(slug, next, userId);
      dispatchProgressChange(slug);
      void replaceRoadmapProgressAction(slug, [...next]);
    },
    [slug, userId],
  );

  return { completedIds, setCompletedIds };
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
