import { DashboardSection } from "@/components/dashboard/dashboard-section";
import type { BuilderLevelInfo } from "@/types/dashboard";

type BuilderLevelSectionProps = {
  level: BuilderLevelInfo;
  displayName: string;
};

export function BuilderLevelSection({ level, displayName }: BuilderLevelSectionProps) {
  return (
    <DashboardSection
      id="builder-level"
      title="Builder level"
      description={`${displayName}'s current rank and XP.`}
    >
      <div className="rounded-none border border-border bg-card p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              Current level
            </p>
            <p className="text-4xl font-semibold tracking-tight">Level {level.level}</p>
          </div>
          <p className="rounded-none border border-ink/20 bg-signal/20 px-2 py-1 text-sm font-medium text-ink">
            {level.xp} XP total
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {level.xpIntoLevel} / {level.xpForNextLevel} XP
            </span>
            <span>{level.progressPercentage}% to next level</span>
          </div>
          <div className="h-2 overflow-hidden rounded-none bg-muted/60">
            <div
              className="h-full rounded-none bg-signal transition-[width] duration-700 ease-out"
              style={{ width: `${level.progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={level.progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="XP progress to next level"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Earn XP by completing lessons, submitting projects, getting approvals, and
            finishing roadmaps.
          </p>
        </div>
      </div>
    </DashboardSection>
  );
}
