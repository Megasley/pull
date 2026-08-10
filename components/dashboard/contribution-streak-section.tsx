import Link from "next/link";
import { Flame } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { cn } from "@/lib/utils";
import type { ContributionStreak } from "@/types/dashboard";

type ContributionStreakSectionProps = {
  streak: ContributionStreak;
};

export function ContributionStreakSection({ streak }: ContributionStreakSectionProps) {
  const isHot = streak.current > 0;

  return (
    <DashboardSection
      id="contribution-streak"
      title="Contribution streak"
      description="From your synced GitHub contribution calendar."
      action={
        <Link
          href="/settings/github"
          className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
        >
          ./sync
        </Link>
      }
    >
      <div
        className={cn(
          "grid grid-cols-3 gap-3 rounded-none border p-4",
          isHot ? "border-ink/25 bg-signal/15" : "border-border bg-card",
        )}
      >
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            <Flame
              className={cn("size-3.5", isHot ? "text-ink" : "text-muted-foreground")}
              aria-hidden
            />
            Current
          </p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tracking-tight",
              isHot && "text-ink",
            )}
          >
            {streak.current}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">days</p>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Longest
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{streak.longest}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">days</p>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Active days
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{streak.totalDays}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">this year</p>
        </div>
      </div>
    </DashboardSection>
  );
}
