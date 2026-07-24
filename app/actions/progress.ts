"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import {
  getAllCompletedNodeSlugs,
  getCompletedNodeSlugs,
  mergeRoadmapProgress,
  replaceRoadmapProgress,
  setNodeCompletion,
} from "@/lib/progress/repository";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import type { RoadmapProgressSummary } from "@/types/progress";

export async function fetchRoadmapProgressAction(roadmapSlug: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { authenticated: false as const, completedNodeSlugs: [] as string[] };
  }

  const completedNodeSlugs = await getCompletedNodeSlugs(user.id, roadmapSlug);

  return {
    authenticated: true as const,
    completedNodeSlugs,
  };
}

export async function toggleLessonProgressAction(
  roadmapSlug: string,
  nodeSlug: string,
  completed: boolean,
) {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }

  await setNodeCompletion(user.id, roadmapSlug, nodeSlug, completed);
  revalidatePath("/dashboard");
  revalidatePath(`/roadmaps/${roadmapSlug}`);
  revalidatePath(`/roadmaps/${roadmapSlug}/lessons/${nodeSlug}`);

  return { ok: true as const };
}

export async function mergeRoadmapProgressAction(
  roadmapSlug: string,
  completedNodeSlugs: string[],
) {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, completedNodeSlugs };
  }

  const merged = await mergeRoadmapProgress(user.id, roadmapSlug, completedNodeSlugs);
  revalidatePath("/dashboard");

  return { ok: true as const, completedNodeSlugs: merged };
}

/** @deprecated Use mergeRoadmapProgressAction */
export async function syncRoadmapProgressAction(
  roadmapSlug: string,
  completedNodeSlugs: string[],
) {
  return mergeRoadmapProgressAction(roadmapSlug, completedNodeSlugs);
}

export async function replaceRoadmapProgressAction(
  roadmapSlug: string,
  completedNodeSlugs: string[],
) {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, completedNodeSlugs };
  }

  const replaced = await replaceRoadmapProgress(
    user.id,
    roadmapSlug,
    completedNodeSlugs,
  );
  revalidatePath("/dashboard");
  revalidatePath(`/roadmaps/${roadmapSlug}`);

  return { ok: true as const, completedNodeSlugs: replaced };
}

export async function getDashboardProgressAction(): Promise<RoadmapProgressSummary[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const progressByRoadmap = await getAllCompletedNodeSlugs(user.id);

  return buildAllRoadmapProgressSummaries(progressByRoadmap);
}
