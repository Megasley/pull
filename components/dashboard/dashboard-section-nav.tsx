"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "learn", label: "Learn" },
  { id: "build", label: "Build" },
  { id: "contribute", label: "Contribute" },
  { id: "prove", label: "Prove" },
] as const;

export function DashboardSectionNav() {
  const [activeId, setActiveId] = useState<string>("learn");

  useEffect(() => {
    const elements = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((node): node is HTMLElement => Boolean(node));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-14 z-30 -mx-4 border-y border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <ul className="flex gap-1 overflow-x-auto py-2">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "inline-flex whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
                activeId === section.id
                  ? "border-ink/30 bg-signal text-ink"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
