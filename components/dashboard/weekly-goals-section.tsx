"use client";

import { useTransition } from "react";
import Link from "next/link";

import { markWeeklyGoalDoneAction } from "@/app/actions/weekly-goals";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WeeklyGoalItem } from "@/types/dashboard";

type WeeklyGoalsSectionProps = {
  goals: WeeklyGoalItem[];
};

export function WeeklyGoalsSection({ goals }: WeeklyGoalsSectionProps) {
  const [pending, startTransition] = useTransition();

  if (goals.length === 0) {
    return null;
  }

  return (
    <DashboardSection
      id="weekly-goals"
      title="Weekly goals"
      description="Auto-tracks PRs and lessons. Mark Discover goals when done."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/issues">./issues</Link>
        </Button>
      }
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const pct = Math.min(
            100,
            Math.round(
              (goal.progressCount / Math.max(goal.targetCount, 1)) * 100,
            ),
          );
          const done = goal.progressCount >= goal.targetCount;

          return (
            <li
              key={goal.id}
              className={cn(
                "border p-3",
                done ? "border-ink/25 bg-signal/15" : "border-border bg-card",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{goal.title}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {goal.progressCount}/{goal.targetCount}
                  </p>
                </div>
                {goal.targetType === "custom" && !done ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await markWeeklyGoalDoneAction(goal.id);
                      });
                    }}
                  >
                    Done
                  </Button>
                ) : done ? (
                  <span className="font-mono text-[10px] text-ink uppercase">
                    done
                  </span>
                ) : null}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden bg-muted/60">
                <div
                  className="h-full bg-signal transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={goal.title}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardSection>
  );
}
