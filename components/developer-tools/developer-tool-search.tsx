"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-none border border-border bg-transparent py-2 pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type DeveloperToolSearchProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function DeveloperToolSearch({
  value,
  onChange,
  disabled,
}: DeveloperToolSearchProps) {
  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor="developer-tools-q" className="sr-only">
        Search tools
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id="developer-tools-q"
        name="q"
        value={value}
        disabled={disabled}
        placeholder="Search tools..."
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClassName)}
      />
    </div>
  );
}
