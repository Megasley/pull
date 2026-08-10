"use client";

import { useMemo, useState } from "react";

import { AchievementCard } from "@/components/achievements/achievement-card";
import { EmptyState } from "@/components/design-system";
import { ACHIEVEMENT_CATEGORY_LABELS } from "@/lib/achievements/definitions";
import { cn } from "@/lib/utils";
import type { AchievementItem } from "@/types/dashboard";
import type { AchievementCategory } from "@/types/achievement";

type AchievementGalleryProps = {
  achievements: AchievementItem[];
  showFilters?: boolean;
};

const FILTERS: Array<"all" | "earned" | "locked" | AchievementCategory> = [
  "all",
  "earned",
  "locked",
  "learning",
  "projects",
  "open-source",
  "milestones",
];

export function AchievementGallery({
  achievements,
  showFilters = true,
}: AchievementGalleryProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = useMemo(() => {
    return achievements.filter((item) => {
      if (filter === "all") return true;
      if (filter === "earned") return item.earned;
      if (filter === "locked") return !item.earned;
      return item.category === filter;
    });
  }, [achievements, filter]);

  const earnedCount = achievements.filter((item) => item.earned).length;

  return (
    <div className="space-y-5">
      {showFilters ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {earnedCount} of {achievements.length} unlocked
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter achievements"
          >
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-none border px-2.5 py-1 text-xs transition-colors",
                  filter === item
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item === "all"
                  ? "All"
                  : item === "earned"
                    ? "Unlocked"
                    : item === "locked"
                      ? "Locked"
                      : ACHIEVEMENT_CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No achievements in this filter"
          description="Try another filter or keep building to unlock more."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
              className="animate-fade-in-up"
            />
          ))}
        </ul>
      )}
    </div>
  );
}
