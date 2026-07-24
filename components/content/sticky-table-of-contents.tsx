"use client";

import { cn } from "@/lib/utils";
import type { TocItem } from "@/types/content";

type StickyTableOfContentsProps = {
  items: TocItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  className?: string;
};

export function StickyTableOfContents({
  items,
  activeId,
  onNavigate,
  className,
}: StickyTableOfContentsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents" className={cn("space-y-3", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        On this page
      </p>
      <ul className="max-h-64 space-y-1 overflow-y-auto border-l border-border pl-3 text-sm xl:max-h-none xl:overflow-visible">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <li key={item.id} className={cn(item.depth === 3 && "pl-3")}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "block w-full min-w-0 py-1.5 text-left break-words transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
