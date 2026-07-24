"use client";

import { useMemo, useState, useTransition } from "react";

import { EmptyState } from "@/components/design-system";
import { TimelineItem } from "@/components/timeline/timeline-item";
import { Button } from "@/components/ui/button";
import {
  TIMELINE_DATE_RANGES,
  TIMELINE_EVENT_TYPES,
  TIMELINE_TYPE_LABEL,
  filterTimelineEvents,
  groupTimelineByDay,
} from "@/lib/timeline/filter";
import { cn } from "@/lib/utils";
import type {
  ContributionTimelineData,
  TimelineDateRange,
  TimelineEventType,
} from "@/types/timeline";

type ContributionTimelineProps = {
  data: ContributionTimelineData;
};

export function ContributionTimeline({ data }: ContributionTimelineProps) {
  const [types, setTypes] = useState<TimelineEventType[] | "all">("all");
  const [range, setRange] = useState<TimelineDateRange>("90d");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => filterTimelineEvents(data.events, { types, range }),
    [data.events, types, range],
  );

  const groups = useMemo(() => groupTimelineByDay(filtered), [filtered]);

  function toggleType(type: TimelineEventType) {
    startTransition(() => {
      setTypes((current) => {
        if (current === "all") return [type];
        if (current.includes(type)) {
          const next = current.filter((item) => item !== type);
          return next.length === 0 ? "all" : next;
        }
        return [...current, type];
      });
    });
  }

  if (data.events.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Sync GitHub, complete roadmap lessons, or submit projects to start filling your contribution timeline."
        actionLabel="Sync GitHub"
        actionHref="/settings/github"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-none border border-border bg-card p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Date range
          </p>
          <div className="flex flex-wrap gap-2">
            {TIMELINE_DATE_RANGES.map((option) => (
              <FilterChip
                key={option.value}
                active={range === option.value}
                onClick={() =>
                  startTransition(() => {
                    setRange(option.value);
                  })
                }
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Activity type
            </p>
            {types !== "all" ? (
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4"
                onClick={() =>
                  startTransition(() => {
                    setTypes("all");
                  })
                }
              >
                Show all
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {TIMELINE_EVENT_TYPES.map((type) => (
              <FilterChip
                key={type}
                active={types === "all" || types.includes(type)}
                onClick={() => toggleType(type)}
              >
                {TIMELINE_TYPE_LABEL[type]}
                <span className="ml-1 tabular-nums opacity-70">
                  {data.totals[type]}
                </span>
              </FilterChip>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} event{filtered.length === 1 ? "" : "s"}
          {range === "all"
            ? " · all time"
            : ` · ${TIMELINE_DATE_RANGES.find((item) => item.value === range)?.label ?? range}`}
        </p>
      </div>

      <div
        className={cn(
          "space-y-8 transition-opacity duration-200",
          pending ? "opacity-60" : "opacity-100",
        )}
      >
        {groups.length === 0 ? (
          <EmptyState
            title="No events in this range"
            description="Widen the date range or turn more activity types back on."
            actionLabel="Reset filters"
            onAction={() => {
              startTransition(() => {
                setTypes("all");
                setRange("90d");
              });
            }}
          />
        ) : (
          groups.map((group) => (
            <section key={group.key} className="relative pl-2 sm:pl-4">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold tracking-tight">
                  {group.label}
                </h2>
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground">
                  {group.events.length}
                </span>
              </div>

              <ol className="relative space-y-3 border-l border-border pl-5 sm:pl-6">
                {group.events.map((event, index) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute top-5 -left-[1.55rem] size-2 rounded-full bg-foreground/70 sm:-left-[1.8rem]"
                    />
                    <TimelineItem event={event} index={index} />
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="h-8 rounded-none px-2.5 text-xs"
    >
      {children}
    </Button>
  );
}
