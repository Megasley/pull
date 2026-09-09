import { ACHIEVEMENT_ICONS } from "@/components/achievements/achievement-icons";
import type { UnlockedAchievementSummary } from "@/app/actions/first-contribution";

/** Same visual language as AchievementCard's "earned + just unlocked" state
 *  (components/achievements/achievement-card.tsx) — border-ink/30 bg-signal/15,
 *  the achievement-unlock/-icon/-glow animation classes already defined in
 *  app/globals.css. Reused here rather than invented, so "you unlocked
 *  something" looks and feels the same everywhere on Pull. Rendered inline,
 *  right where the user completed the journey, rather than only in the
 *  toast (components/achievements/achievement-unlock-toast.tsx) that shows
 *  up on /achievements or the dashboard — those pages might not be visited
 *  for a while, and this moment deserves to land immediately. */
export function FirstContributionCelebration({
  achievements,
}: {
  achievements: UnlockedAchievementSummary[];
}) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4" role="status" aria-live="polite">
      {achievements.map((achievement) => {
        const Icon = ACHIEVEMENT_ICONS[achievement.icon];

        return (
          <div
            key={achievement.id}
            className="achievement-unlock relative overflow-hidden border border-ink/30 bg-signal/15 px-5 py-5 sm:px-6"
          >
            <div
              aria-hidden
              className="achievement-unlock-glow pointer-events-none absolute inset-0"
            />
            <div className="relative flex items-start gap-4">
              <div className="achievement-unlock-icon flex size-12 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
                <Icon className="size-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-medium tracking-wide text-primary uppercase">
                  Achievement unlocked
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">{achievement.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                {achievement.xpReward > 0 ? (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    +{achievement.xpReward} XP
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
