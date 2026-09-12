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
  applyNodeCompletionSnapshot,
  progressMutationCoordinator,
  reconcileProgressSnapshot,
  type ProgressScope,
} from "@/lib/progress/pending-mutations";
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

function writeProgressSnapshot(
  scope: ProgressScope,
  completedNodeSlugs: Iterable<string>,
) {
  writeStoredCompletedIds(scope.roadmapSlug, new Set(completedNodeSlugs), scope.userId);
  dispatchProgressChange(scope.roadmapSlug);
}

async function reconcileFromServer(scope: ProgressScope): Promise<boolean> {
  const completedNodeSlugs = await reconcileProgressSnapshot(
    progressMutationCoordinator,
    scope,
    async () => {
      const result = await fetchRoadmapProgressAction(scope.roadmapSlug);
      return result.authenticated ? result.completedNodeSlugs : null;
    },
  );

  if (!completedNodeSlugs) {
    return false;
  }

  writeProgressSnapshot(scope, completedNodeSlugs);
  return true;
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

    void reconcileFromServer({ userId, roadmapSlug: slug }).catch(() => undefined);
  }, [authReady, slug, userId]);

  const setNodeCompleted = useCallback(
    (nodeSlug: string, completed: boolean) => {
      if (!userId) {
        return;
      }

      const current = new Set(
        JSON.parse(getCompletedSnapshot(slug, userId)) as string[],
      );
      const scope = { userId, roadmapSlug: slug };
      const mutation = progressMutationCoordinator.begin(
        scope,
        nodeSlug,
        completed,
        current.has(nodeSlug),
      );
      const next = applyNodeCompletionSnapshot(current, nodeSlug, completed);

      writeProgressSnapshot(scope, next);

      void (async () => {
        let accepted = false;
        try {
          const result = await toggleLessonProgressAction(slug, nodeSlug, completed);
          accepted = result.ok;
        } catch {
          accepted = false;
        }

        const settled = progressMutationCoordinator.settle(
          scope,
          nodeSlug,
          mutation.token,
        );

        let reconciled = false;
        try {
          reconciled = await reconcileFromServer(scope);
        } catch {
          reconciled = false;
        }

        if (!accepted && settled && !reconciled) {
          const cached = new Set(
            JSON.parse(getCompletedSnapshot(slug, userId)) as string[],
          );
          const rolledBack = applyNodeCompletionSnapshot(
            cached,
            nodeSlug,
            settled.previousCompleted,
          );
          writeProgressSnapshot(
            scope,
            progressMutationCoordinator.overlay(scope, rolledBack),
          );
        }
      })();
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
