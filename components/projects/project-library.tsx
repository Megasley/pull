"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import {
  DIFFICULTY_OPTIONS,
  PROJECT_PAGE_SIZE,
  filterProjects,
  getProjectCategories,
  paginateProjects,
} from "@/lib/projects/catalog";
import { cn } from "@/lib/utils";
import type { ProjectCatalogItem, ProjectCategory } from "@/types/project";
import type { SubmissionStatus } from "@/types/submission";
import type { RoadmapDifficulty } from "@/types";

type ProjectLibraryProps = {
  projects: ProjectCatalogItem[];
  submissionStatusBySlug?: Record<string, SubmissionStatus>;
};

const difficultyLabels: Record<RoadmapDifficulty | "all", string> = {
  all: "All levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ProjectLibrary({
  projects,
  submissionStatusBySlug = {},
}: ProjectLibraryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProjectCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<RoadmapDifficulty | "all">("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const categories = getProjectCategories();

  const difficultyCounts = useMemo(() => {
    const counts: Record<RoadmapDifficulty | "all", number> = {
      all: projects.length,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };
    for (const project of projects) {
      counts[project.difficulty] += 1;
    }
    return counts;
  }, [projects]);

  const filtered = useMemo(
    () =>
      filterProjects(projects, {
        query: deferredQuery,
        category,
        difficulty,
      }),
    [projects, deferredQuery, category, difficulty],
  );

  const paginated = useMemo(
    () => paginateProjects(filtered, page, PROJECT_PAGE_SIZE),
    [filtered, page],
  );

  function resetPageOnFilter() {
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-none border border-border bg-card p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search projects</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPageOnFilter();
            }}
            placeholder="Search by title, skill, or prerequisite…"
            className="h-10 w-full rounded-none border border-border bg-transparent pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>

        <div className="space-y-3">
          <FilterRow label="Category">
            <FilterChip
              active={category === "all"}
              onClick={() => {
                setCategory("all");
                resetPageOnFilter();
              }}
            >
              All
            </FilterChip>
            {categories.map((item) => (
              <FilterChip
                key={item}
                active={category === item}
                onClick={() => {
                  setCategory(item);
                  resetPageOnFilter();
                }}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Difficulty">
            {DIFFICULTY_OPTIONS.map((item) => (
              <FilterChip
                key={item}
                active={difficulty === item}
                onClick={() => {
                  setDifficulty(item);
                  resetPageOnFilter();
                }}
                tone={item === "all" ? "default" : item}
              >
                {difficultyLabels[item]}
                <span className="ml-1 font-mono text-[10px] opacity-70">
                  {difficultyCounts[item]}
                </span>
              </FilterChip>
            ))}
          </FilterRow>
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} project{filtered.length === 1 ? "" : "s"}
          {deferredQuery || category !== "all" || difficulty !== "all"
            ? " matching filters"
            : " in the library"}
        </p>
      </div>

      {paginated.items.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try a different search term or clear filters to see the full library."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery("");
            setCategory("all");
            setDifficulty("all");
            setPage(1);
          }}
        />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {paginated.items.map((project, index) => (
              <ProjectCard
                key={project.slug}
                project={project}
                index={index}
                submissionStatus={submissionStatusBySlug[project.slug] ?? null}
              />
            ))}
          </div>

          {paginated.totalPages > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6"
              aria-label="Project pagination"
            >
              <p className="text-sm text-muted-foreground">
                Page {paginated.page} of {paginated.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paginated.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paginated.page >= paginated.totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(paginated.totalPages, current + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  tone = "default",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | RoadmapDifficulty;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-none border px-2.5 py-1 text-xs transition-colors",
        active
          ? tone === "beginner"
            ? "border-ink/20 bg-signal text-ink"
            : tone === "intermediate"
              ? "border-ink/30 bg-ink/10 text-ink"
              : tone === "advanced"
                ? "border-ink bg-ink text-[var(--background)]"
                : "border-primary/40 bg-primary/15 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
