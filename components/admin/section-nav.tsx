"use client";

import { useEffect, useState } from "react";

export type AdminNavSection = {
  id: string;
  label: string;
};

/**
 * Sticky in-page jump nav with scrollspy — lets an admin skip straight to a
 * section on a long page instead of scrolling past everything else. Purely
 * client-side highlighting; the anchors themselves are plain hash links so
 * navigation still works with JS disabled.
 */
export function AdminSectionNav({ sections }: { sections: AdminNavSection[] }) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      className="sticky top-0 z-10 -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      aria-label="Page sections"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`shrink-0 rounded-none border px-2.5 py-1 font-mono text-[11px] tracking-wide whitespace-nowrap uppercase transition-colors ${
            activeId === section.id
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
          }`}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
