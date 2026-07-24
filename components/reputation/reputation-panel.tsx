import { cn } from "@/lib/utils";
import type {
  ReputationFactor,
  ReputationResult,
  ReputationStrength,
} from "@/types/reputation";

const STRENGTH_LABEL: Record<ReputationStrength, string> = {
  emerging: "Emerging",
  building: "Building",
  strong: "Strong",
  exceptional: "Exceptional",
};

type ReputationPanelProps = {
  reputation: ReputationResult;
  className?: string;
  compact?: boolean;
};

export function ReputationPanel({
  reputation,
  className,
  compact = false,
}: ReputationPanelProps) {
  const maxMonth = Math.max(
    1,
    ...reputation.monthly.map((month) => month.total),
  );

  return (
    <div
      className={cn(
        "rounded-none border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          <ScoreRing value={reputation.score} />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              Open Source Reputation
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/80">
                {reputation.version}
              </span>
            </p>
            <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {reputation.score}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                / 100
              </span>
            </p>
            {!compact ? (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {reputation.summary}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-6 grid gap-3",
          compact ? "sm:grid-cols-2" : "md:grid-cols-2",
        )}
      >
        {reputation.factors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} />
        ))}
      </div>

      {!compact ? (
        <>
          <section className="mt-8 space-y-3">
            <h3 className="text-sm font-medium">Monthly progress</h3>
            <div className="flex h-28 items-end gap-1.5 rounded-none border border-border bg-transparent p-3">
              {reputation.monthly.map((month) => {
                const height = Math.max(
                  4,
                  Math.round((month.total / maxMonth) * 100),
                );
                return (
                  <div
                    key={month.key}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    title={`${month.label}: ${month.total} events (${month.merged} merged)`}
                  >
                    <div
                      className="w-full rounded-sm bg-foreground/80 transition-[height] duration-500"
                      style={{ height: `${height}%` }}
                    />
                    <span className="truncate text-[9px] text-muted-foreground">
                      {month.label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 12 months of merges, opened PRs, issues, and reviews.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h3 className="text-sm font-medium">Recent milestones</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {reputation.milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className={cn(
                    "rounded-none border px-3 py-3",
                    milestone.earned
                      ? "border-ink/25 bg-signal/15"
                      : "border-border bg-transparent opacity-70",
                  )}
                >
                  <p className="text-sm font-medium">{milestone.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {milestone.description}
                  </p>
                  <p className="mt-2 text-[11px] font-medium">
                    {milestone.earned ? "Earned" : "Locked"}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-5 text-xs text-muted-foreground">
            Reputation measures open source impact - merges, reviews, cadence,
            diversity, docs, issues, and code reviews. Weighting can evolve;
            scores stay comparable within each scoring era.
          </p>
        </>
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
      aria-label={`Open Source Reputation ${value} out of 100`}
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

function FactorRow({ factor }: { factor: ReputationFactor }) {
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
      <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
        Signal {factor.raw}
      </p>
    </div>
  );
}
