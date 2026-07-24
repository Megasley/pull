import { cn } from "@/lib/utils";
import type { GithubContributionDay } from "@/types/github";

type ContributionGraphProps = {
  days: GithubContributionDay[];
  className?: string;
};

function levelFromCount(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const LEVEL_CLASS = [
  "bg-muted/70",
  "bg-foreground/25",
  "bg-foreground/45",
  "bg-foreground/70",
  "bg-foreground",
];

export function ContributionGraph({ days, className }: ContributionGraphProps) {
  if (days.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Contribution graph will appear after the first successful sync.
      </p>
    );
  }

  // GitHub weeks are Sunday-start columns; render as 7-row grid by week.
  const weeks: GithubContributionDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total}</span> contributions
          in the last year
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {LEVEL_CLASS.map((cls) => (
            <span
              key={cls}
              className={cn("size-2 rounded-[2px] sm:size-2.5", cls)}
              aria-hidden
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="relative">
        <div
          className="overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]"
          role="img"
          aria-label={`${total} contributions over the last year`}
        >
          <div className="inline-flex min-w-full justify-end gap-[2px] sm:gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px] sm:gap-1">
                {week.map((day) => {
                  const level = levelFromCount(day.count);
                  return (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} contribution${day.count === 1 ? "" : "s"}`}
                      className={cn(
                        "size-2 shrink-0 rounded-[2px] sm:size-2.5",
                        LEVEL_CLASS[level],
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden"
        />
        <p className="mt-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase sm:hidden">
          scroll →
        </p>
      </div>
    </div>
  );
}
