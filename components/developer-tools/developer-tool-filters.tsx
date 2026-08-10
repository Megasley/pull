"use client";

import { cn } from "@/lib/utils";
import type {
  DeveloperToolCategory,
  DeveloperToolFilter,
} from "@/lib/developer-tools";

type DeveloperToolFiltersProps = {
  value: DeveloperToolFilter;
  onChange: (value: DeveloperToolFilter) => void;
  categories: DeveloperToolCategory[];
  disabled?: boolean;
};

export function DeveloperToolFilters({
  value,
  onChange,
  categories,
  disabled,
}: DeveloperToolFiltersProps) {
  if (categories.length <= 1) return null;

  const filters: DeveloperToolFilter[] = ["All", ...categories];

  return (
    <div>
      <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        Filter by category
      </p>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Tool categories"
      >
        {filters.map((filter) => {
          const active = value === filter;
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(filter)}
              className={cn(
                "rounded-none border px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors",
                active
                  ? "border-ink bg-ink text-background"
                  : "border-ink/25 hover:border-ink hover:bg-muted/40",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
