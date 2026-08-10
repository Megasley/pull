import Link from "next/link";

import { cn } from "@/lib/utils";
import type { BuilderLevelInfo, ContributionStreak } from "@/types/dashboard";

type DashboardStatusBarProps = {
  level: BuilderLevelInfo;
  streak: ContributionStreak;
  builderScore?: number | null;
  reputationScore?: number | null;
  githubUsername: string;
  className?: string;
};

export function DashboardStatusBar({
  level,
  streak,
  builderScore,
  reputationScore,
  githubUsername,
  className,
}: DashboardStatusBarProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      <Stat
        label="Level"
        value={String(level.level)}
        hint={`${level.progressPercentage}% to next`}
        accent
      />
      <Stat
        label="XP"
        value={String(level.xp)}
        hint={`${level.xpIntoLevel} this level`}
      />
      <Stat
        label="Streak"
        value={String(streak.current)}
        hint={`best ${streak.longest}d`}
        accent={streak.current > 0}
      />
      <Stat
        label="Score"
        value={builderScore != null ? String(builderScore) : "—"}
        hint="builder score"
      />
      <Stat
        label="Reputation"
        value={reputationScore != null ? String(reputationScore) : "—"}
        hint="open source"
      />
      <div className="bg-background px-3 py-3">
        <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          GitHub
        </p>
        <Link
          href="/settings/github"
          className="mt-1 block truncate font-mono text-sm text-foreground underline-offset-4 hover:underline"
        >
          @{githubUsername}
        </Link>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">manage sync</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("bg-background px-3 py-3", accent && "bg-signal/15")}>
      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight",
          accent && "text-ink",
        )}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}
