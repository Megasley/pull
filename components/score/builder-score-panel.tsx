import { cn } from "@/lib/utils";
import type {
  BuilderScoreFactor,
  BuilderScoreResult,
  BuilderScoreStrength,
} from "@/types/score";

const STRENGTH_LABEL: Record<BuilderScoreStrength, string> = {
  emerging: "Emerging",
  building: "Building",
  strong: "Strong",
  exceptional: "Exceptional",
};

type BuilderScorePanelProps = {
  score: BuilderScoreResult;
  className?: string;
  compact?: boolean;
};

export function BuilderScorePanel({
  score,
  className,
  compact = false,
}: BuilderScorePanelProps) {
  return (
    <div
      className={cn(
        "rounded-none border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          <ScoreRing value={score.score} />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Builder Score</p>
            <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {score.score}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / 100
              </span>
            </p>
            {!compact ? (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {score.summary}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cn("mt-6 grid gap-3", compact ? "sm:grid-cols-2" : "md:grid-cols-2")}>
        {score.factors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} />
        ))}
      </div>

      {!compact ? (
        <p className="mt-5 text-xs text-muted-foreground">
          Builder Score measures what you build and verify - completed projects,
          approvals, roadmaps, open source work, community reviews, and recent
          consistency. Weighting can evolve as Pull grows; your score stays
          comparable over time within each scoring era.
        </p>
      ) : null}
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative size-20 shrink-0"
      role="img"
      aria-label={`Builder Score ${value} out of 100`}
    >
      <svg className="size-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/50"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-foreground transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}

function FactorRow({ factor }: { factor: BuilderScoreFactor }) {
  return (
    <div className="rounded-none border border-border bg-transparent px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{factor.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {factor.description}
          </p>
        </div>
        <span className="shrink-0 rounded-none border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {STRENGTH_LABEL[factor.strength]}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-none bg-muted/60">
        <div
          className="h-full rounded-none bg-foreground/80 transition-[width] duration-700 ease-out"
          style={{ width: `${factor.strengthPercent}%` }}
        />
      </div>
    </div>
  );
}
