import Link from "next/link";
import { Check, Circle } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { cn } from "@/lib/utils";
import type { PortfolioCompletion } from "@/types/dashboard";

type PortfolioCompletionSectionProps = {
  completion: PortfolioCompletion;
};

export function PortfolioCompletionSection({
  completion,
}: PortfolioCompletionSectionProps) {
  const strong = completion.percentage >= 70;

  return (
    <DashboardSection
      id="portfolio-completion"
      title="Portfolio completion"
      description={`${completion.completed} of ${completion.total} profile signals filled.`}
    >
      <div
        className={cn(
          "rounded-none border p-4",
          strong ? "border-ink/25 bg-signal/15" : "border-border bg-card",
        )}
      >
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tracking-tight">{completion.percentage}%</p>
          <p className="font-mono text-[11px] text-muted-foreground uppercase">
            ready to share
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-none bg-muted/60">
          <div
            className="h-full bg-signal transition-[width] duration-300"
            style={{ width: `${completion.percentage}%` }}
            role="progressbar"
            aria-valuenow={completion.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Portfolio completion"
          />
        </div>
        <ul className="mt-4 space-y-2">
          {completion.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-2 text-sm transition-colors hover:text-foreground"
              >
                {item.done ? (
                  <span className="flex size-4 shrink-0 items-center justify-center border border-ink bg-signal text-ink">
                    <Check className="size-2.5" aria-hidden />
                  </span>
                ) : (
                  <Circle
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
                <span
                  className={
                    item.done ? "text-muted-foreground line-through" : undefined
                  }
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </DashboardSection>
  );
}
