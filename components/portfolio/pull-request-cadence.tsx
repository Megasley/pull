import type { PortfolioCadence } from "@/types/portfolio";

type PullRequestCadenceProps = {
  cadence: PortfolioCadence;
};

const BAR_WIDTH = 14;
const BAR_GAP = 6;
const CHART_HEIGHT = 40;
const MIN_BAR_HEIGHT = 3;

export function PullRequestCadence({ cadence }: PullRequestCadenceProps) {
  const max = Math.max(1, ...cadence.months.map((month) => month.count));
  const width =
    cadence.months.length * BAR_WIDTH + (cadence.months.length - 1) * BAR_GAP;

  return (
    <div className="rounded-none border border-border bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Monthly cadence
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          Active {cadence.activeMonths}/{cadence.months.length} months
        </p>
      </div>

      <svg
        role="img"
        aria-label={`Pull requests landed per month, last ${cadence.months.length} months: ${cadence.months
          .map((month) => `${month.label} ${month.count}`)
          .join(", ")}`}
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        className="mt-3 h-10 w-full"
        preserveAspectRatio="none"
      >
        {cadence.months.map((month, index) => {
          const ratio = month.count / max;
          const barHeight =
            month.count === 0
              ? MIN_BAR_HEIGHT
              : Math.max(MIN_BAR_HEIGHT, ratio * CHART_HEIGHT);
          const x = index * (BAR_WIDTH + BAR_GAP);
          const y = CHART_HEIGHT - barHeight;

          return (
            <rect
              key={month.monthKey}
              x={x}
              y={y}
              width={BAR_WIDTH}
              height={barHeight}
              rx={2}
              className={month.count > 0 ? "fill-signal" : "fill-muted"}
              opacity={month.count === 0 ? 0.5 : Math.max(0.35, ratio)}
            >
              <title>
                {month.label}: {month.count} {month.count === 1 ? "PR" : "PRs"}
              </title>
            </rect>
          );
        })}
      </svg>

      <div
        className="mt-1.5 grid text-center font-mono text-[9px] text-muted-foreground"
        style={{
          gridTemplateColumns: `repeat(${cadence.months.length}, minmax(0, 1fr))`,
        }}
      >
        {cadence.months.map((month, index) => (
          <span key={month.monthKey}>{index % 3 === 0 ? month.label : ""}</span>
        ))}
      </div>
    </div>
  );
}
