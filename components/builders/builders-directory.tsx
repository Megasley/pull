"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

import { BuilderCard } from "@/components/builders/builder-card";
import { EmptyState } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import type {
  BuilderDirectoryCard,
  BuilderDirectorySort,
} from "@/lib/builders/directory";
import {
  BUILDER_DIRECTORY_FILTERS,
  DIRECTORY_LOOKING_FOR_OPTIONS,
  lookingForLabel,
  type LookingForId,
} from "@/lib/builders/looking-for";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SORT_OPTIONS: { value: BuilderDirectorySort; label: string }[] = [
  { value: "oss", label: "OSS reputation" },
  { value: "prs", label: "Merged PRs" },
  { value: "recent", label: "Recently active" },
];

type BuildersDirectoryProps = {
  builders: BuilderDirectoryCard[];
  featured: BuilderDirectoryCard[];
  query: string;
  activeSkills: string[];
  activeLooking: LookingForId[];
  sort: BuilderDirectorySort;
  page: number;
  totalPages: number;
  total: number;
};

export function BuildersDirectory({
  builders,
  featured,
  query,
  activeSkills,
  activeLooking,
  sort,
  page,
  totalPages,
  total,
}: BuildersDirectoryProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const hasFilters =
    Boolean(query.trim()) ||
    activeSkills.length > 0 ||
    activeLooking.length > 0 ||
    sort !== "oss";

  const pushFilters = useCallback(
    (next: {
      q?: string;
      skills?: string[];
      looking?: LookingForId[];
      sort?: BuilderDirectorySort;
      page?: number;
    }) => {
      const params = new URLSearchParams();
      const q = next.q ?? "";
      if (q.trim()) params.set("q", q.trim());

      for (const skill of next.skills ?? []) {
        params.append("skill", skill);
      }
      for (const id of next.looking ?? []) {
        params.append("looking", id);
      }

      const nextSort = next.sort ?? "oss";
      if (nextSort !== "oss") params.set("sort", nextSort);

      const nextPage = next.page ?? 1;
      if (nextPage > 1) params.set("page", String(nextPage));

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/builders?${qs}` : "/builders");
      });
    },
    [router],
  );

  function toggleSkill(skill: string) {
    const exists = activeSkills.some(
      (item) => item.toLowerCase() === skill.toLowerCase(),
    );
    const skills = exists
      ? activeSkills.filter(
          (item) => item.toLowerCase() !== skill.toLowerCase(),
        )
      : [...activeSkills, skill];
    pushFilters({
      q: query,
      skills,
      looking: activeLooking,
      sort,
      page: 1,
    });
  }

  function toggleLooking(id: LookingForId) {
    const exists = activeLooking.includes(id);
    const looking = exists
      ? activeLooking.filter((item) => item !== id)
      : [...activeLooking, id];
    pushFilters({
      q: query,
      skills: activeSkills,
      looking,
      sort,
      page: 1,
    });
  }

  function clearAll() {
    pushFilters({ q: "", skills: [], looking: [], sort: "oss", page: 1 });
  }

  const showFeatured =
    featured.length > 0 &&
    !query.trim() &&
    activeSkills.length === 0 &&
    activeLooking.length === 0 &&
    page === 1;

  const featuredIds = new Set(
    showFeatured ? featured.map((builder) => builder.id) : [],
  );
  const gridBuilders = showFeatured
    ? builders.filter((builder) => !featuredIds.has(builder.id))
    : builders;

  return (
    <div className="space-y-8">
      {showFeatured ? (
        <section aria-labelledby="builders-to-watch-heading">
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            curated // builders to watch
          </p>
          <h2
            id="builders-to-watch-heading"
            className="mt-1 text-lg font-semibold tracking-tight"
          >
            Builders to watch
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Recently active builders with strong open-source reputation.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((builder) => (
              <li key={`watch-${builder.id}`}>
                <BuilderCard builder={builder} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          pushFilters({
            q: String(form.get("q") ?? ""),
            skills: activeSkills,
            looking: activeLooking,
            sort,
            page: 1,
          });
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="builders-q" className="text-sm font-medium">
            Search builders
          </label>
          <input
            id="builders-q"
            name="q"
            defaultValue={query}
            disabled={pending}
            placeholder="Name, username, bio, or skill…"
            className={cn(fieldClassName, "mt-1.5")}
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="builders-sort" className="text-sm font-medium">
            Sort by
          </label>
          <select
            id="builders-sort"
            name="sort"
            disabled={pending}
            value={sort}
            onChange={(event) =>
              pushFilters({
                q: query,
                skills: activeSkills,
                looking: activeLooking,
                sort: event.target.value as BuilderDirectorySort,
                page: 1,
              })
            }
            className={cn(fieldClassName, "mt-1.5")}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={pending}>
          Search
        </Button>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={clearAll}
          >
            Clear
          </Button>
        ) : null}
      </form>

      <div>
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Looking for
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIRECTORY_LOOKING_FOR_OPTIONS.map((option) => {
            const active = activeLooking.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={pending}
                onClick={() => toggleLooking(option.id)}
                className={cn(
                  "rounded-none border px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors",
                  active
                    ? "border-ink bg-ink text-background"
                    : "border-ink/25 hover:border-ink hover:bg-muted/40",
                )}
              >
                {lookingForLabel(option.id)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Filter by skill / technology
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {BUILDER_DIRECTORY_FILTERS.map((skill) => {
            const active = activeSkills.some(
              (item) => item.toLowerCase() === skill.toLowerCase(),
            );
            return (
              <button
                key={skill}
                type="button"
                disabled={pending}
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "rounded-none border px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors",
                  active
                    ? "border-ink bg-ink text-background"
                    : "border-ink/25 hover:border-ink hover:bg-muted/40",
                )}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {gridBuilders.length === 0 && builders.length === 0 ? (
        <EmptyState
          title="No builders matched"
          description="Builders must opt into the directory from Settings → Portfolio. Try clearing filters, or check back after more builders join."
          actionLabel="Clear filters"
          onAction={clearAll}
        />
      ) : gridBuilders.length === 0 ? null : (
        <>
          {showFeatured ? (
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              all builders
            </p>
          ) : null}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gridBuilders.map((builder) => (
              <li key={builder.id}>
                <BuilderCard builder={builder} />
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6"
              aria-label="Builders pagination"
            >
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
                <span className="text-muted-foreground/70">
                  {" "}
                  · {total} builders
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || page <= 1}
                  onClick={() =>
                    pushFilters({
                      q: query,
                      skills: activeSkills,
                      looking: activeLooking,
                      sort,
                      page: page - 1,
                    })
                  }
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || page >= totalPages}
                  onClick={() =>
                    pushFilters({
                      q: query,
                      skills: activeSkills,
                      looking: activeLooking,
                      sort,
                      page: page + 1,
                    })
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
