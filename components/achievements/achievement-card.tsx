"use client";

import { Badge } from "@/components/ui/badge";
import { ACHIEVEMENT_CATEGORY_LABELS } from "@/lib/achievements/definitions";
import { cn } from "@/lib/utils";
import type { AchievementItem } from "@/types/dashboard";
import type { AchievementCategory } from "@/types/achievement";

type AchievementCardProps = {
  achievement: AchievementItem;
  index?: number;
  className?: string;
};

export function AchievementCard({
  achievement,
  index = 0,
  className,
}: AchievementCardProps) {
  const category = achievement.category as AchievementCategory | undefined;
  const celebrate = achievement.earned && achievement.recentlyUnlocked;

  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-none border px-4 py-4 transition-all duration-300",
        achievement.earned
          ? "border-ink/30 bg-signal/15"
          : "border-border bg-card opacity-75",
        celebrate && "achievement-unlock",
        className,
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {celebrate ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-signal/10"
        />
      ) : null}

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-none border text-xl",
            achievement.earned
              ? "border-primary/30 bg-primary/10"
              : "border-border bg-muted/30 grayscale",
            celebrate && "achievement-unlock-icon",
          )}
          aria-hidden
        >
          {achievement.icon}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{achievement.title}</p>
            {achievement.earned ? (
              <Badge variant="secondary" className="text-[10px]">
                Unlocked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Locked
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {achievement.description}
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground">
            {category ? (
              <span>{ACHIEVEMENT_CATEGORY_LABELS[category]}</span>
            ) : null}
            {typeof achievement.xpReward === "number" && achievement.xpReward > 0 ? (
              <span className="font-mono">+{achievement.xpReward} XP</span>
            ) : null}
            {achievement.earned && achievement.earnedAt ? (
              <span>
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  new Date(achievement.earnedAt),
                )}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
