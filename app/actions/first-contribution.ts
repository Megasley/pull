"use server";

import { revalidatePath } from "next/cache";

import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements/definitions";
import { getCurrentUser } from "@/lib/auth/session";
import { deriveStepCompletionEvents } from "@/lib/first-contribution/analytics";
import { trackFirstContributionEvent } from "@/lib/first-contribution/analytics-server";
import {
  getFirstContributionProgress,
  setFirstContributionStepCompletion,
} from "@/lib/first-contribution/progress";
import { getFirstContributionStep } from "@/lib/first-contribution/steps";
import { recordMilestones } from "@/lib/milestones/service";
import type { MilestoneCandidate } from "@/lib/milestones/types";
import { syncAchievementsForUser } from "@/lib/xp/achievements";
import type { AchievementIconKey } from "@/types/achievement";

export type UnlockedAchievementSummary = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: AchievementIconKey;
};

export type SetFirstContributionStepResult =
  | { ok: true; unlockedAchievements: UnlockedAchievementSummary[] }
  | { ok: false; reason: "unauthenticated" | "unknown_step" };

export async function setFirstContributionStepCompletionAction(
  stepSlug: string,
  completed: boolean,
): Promise<SetFirstContributionStepResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const step = getFirstContributionStep(stepSlug);
  if (!step) {
    return { ok: false, reason: "unknown_step" };
  }

  let unlockedAchievements: UnlockedAchievementSummary[] = [];

  if (completed) {
    // Snapshot before/after so deriveStepCompletionEvents can tell a genuinely
    // new completion from a duplicate one and fire "started"/"completed"
    // exactly at their real transitions, not on every call.
    const before = await getFirstContributionProgress(user.id);
    const isNewCompletion = !before.completedSlugs.includes(stepSlug);

    await setFirstContributionStepCompletion(user.id, stepSlug, true);

    const after = isNewCompletion ? await getFirstContributionProgress(user.id) : before;
    const events = deriveStepCompletionEvents(before, after, isNewCompletion);

    for (const event of events) {
      await trackFirstContributionEvent(
        event,
        event === "first_contribution_step_completed"
          ? { step: step.order, stepSlug: step.slug }
          : undefined,
      );
    }

    // Admin-facing counterparts of the same started/completed transitions —
    // reuses the existing milestone_events + admin_notifications pipeline
    // (see lib/milestones/service.ts) rather than a separate admin system.
    // Deliberately no per-step milestone here: recordMilestones' default
    // notify:true only creates the in-app admin notification, so admins
    // never get one for every one of the 10 steps.
    const milestoneCandidates: MilestoneCandidate[] = [];
    if (events.includes("first_contribution_started") && after.startedAt) {
      milestoneCandidates.push({
        userId: user.id,
        milestoneType: "first_contribution_started",
        occurredAt: after.startedAt,
      });
    }
    if (events.includes("first_contribution_completed") && after.completedAt) {
      milestoneCandidates.push({
        userId: user.id,
        milestoneType: "first_contribution_completed",
        occurredAt: after.completedAt,
      });
    }
    if (milestoneCandidates.length > 0) {
      await recordMilestones(milestoneCandidates);
    }

    // Same hook every roadmap lesson completion already calls (see
    // onLessonCompleted in lib/xp/achievements.ts) — First Contribution
    // steps write to the same userRoadmapProgress table, so this is the
    // real connection to Pull's achievement/XP/profile system, not a
    // separate one. Only on a genuinely new completion, matching the
    // analytics/milestone idempotency above. Awards XP, unlocks
    // "First Contribution" once all 10 steps are done (see
    // lib/achievements/definitions.ts), and fires the existing
    // achievement-unlock email — all through infrastructure that already
    // exists for every other roadmap.
    if (isNewCompletion) {
      const unlockedSlugs = await syncAchievementsForUser(user.id);
      unlockedAchievements = unlockedSlugs
        .map((slug) => ACHIEVEMENT_DEFINITIONS.find((definition) => definition.id === slug))
        .filter((definition): definition is NonNullable<typeof definition> =>
          Boolean(definition),
        )
        .map((definition) => ({
          id: definition.id,
          title: definition.title,
          description: definition.description,
          xpReward: definition.xpReward,
          icon: definition.icon,
        }));
    }
  } else {
    await setFirstContributionStepCompletion(user.id, stepSlug, false);
  }

  revalidatePath(`/first-contribution/${stepSlug}`);
  revalidatePath("/first-contribution");

  return { ok: true, unlockedAchievements };
}
