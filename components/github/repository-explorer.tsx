"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { RepositoryCard } from "@/components/github/repository-card";
import { Button } from "@/components/ui/button";
import {
  REPO_PAGE_SIZE,
  filterAndSortRepositories,
  getRepositoryLanguages,
  paginateRepositories,
  type RepoSort,
} from "@/lib/github/explorer";
import { cn } from "@/lib/utils";
import type { GithubRepositoryRecord } from "@/types/github";

type RepositoryExplorerProps = {
  repositories: GithubRepositoryRecord[];
  connected: boolean;
};

const SORT_OPTIONS: Array<{ value: RepoSort; label: string }> = [
  { value: "recent", label: "Recently updated" },
  { value: "stars", label: "Most starred" },
  { value: "name", label: "Name" },
];

export function RepositoryExplorer({
  repositories,
  connected,
}: RepositoryExplorerProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string | "all">("all");
  const [sort, setSort] = useState<RepoSort>("recent");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const languages = useMemo(
    () => getRepositoryLanguages(repositories),
    [repositories],
  );

  const filtered = useMemo(
    () =>
      filterAndSortRepositories(repositories, {
        query: deferredQuery,
        language,
        sort,
      }),
    [repositories, deferredQuery, language, sort],
  );

  const paginated = useMemo(
    () => paginateRepositories(filtered, page, REPO_PAGE_SIZE),
    [filtered, page],
  );

  function resetPage() {
    setPage(1);
  }

  if (!connected) {
    return (
      <EmptyState
        title="Connect GitHub to explore repositories"
        description="Sync your GitHub account to load repositories with language, stars, topics, and contribution status."
        actionLabel="Open GitHub settings"
        actionHref="/settings/github"
      />
    );
  }

  if (repositories.length === 0) {
    return (
      <EmptyState
        title="No repositories synced yet"
        description="Run a GitHub sync to pull your repositories into Pull."
        actionLabel="Sync GitHub"
        actionHref="/settings/github"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-none border border-border bg-card p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search repositories</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            placeholder="Search by name, topic, license, or language…"
            className="h-10 w-full rounded-none border border-border bg-transparent pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>

        <div className="space-y-3">
          <FilterRow label="Sort">
            {SORT_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={sort === option.value}
                onClick={() => {
                  setSort(option.value);
                  resetPage();
                }}
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Language">
            <FilterChip
              active={language === "all"}
              onClick={() => {
                setLanguage("all");
                resetPage();
              }}
            >
              All
            </FilterChip>
            {languages.map((item) => (
              <FilterChip
                key={item}
                active={language === item}
                onClick={() => {
                  setLanguage(item);
                  resetPage();
                }}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Showing{" "}
          <span className="font-medium text-foreground">
            {paginated.items.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{paginated.total}</span>{" "}
          repositories
        </p>
        <p>
          Page {paginated.page} / {paginated.totalPages}
        </p>
      </div>

      {paginated.items.length === 0 ? (
        <EmptyState
          title="No matching repositories"
          description="Try a different search, language, or sort."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery("");
            setLanguage("all");
            setSort("recent");
            setPage(1);
          }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.items.map((repository) => (
            <li key={repository.id}>
              <RepositoryCard repository={repository} />
            </li>
          ))}
        </ul>
      )}

      {paginated.totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Repository pagination"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!paginated.hasPrev}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          {Array.from({ length: paginated.totalPages }, (_, index) => index + 1)
            .filter((pageNumber) => {
              if (paginated.totalPages <= 7) return true;
              return (
                pageNumber === 1 ||
                pageNumber === paginated.totalPages ||
                Math.abs(pageNumber - paginated.page) <= 1
              );
            })
            .map((pageNumber, index, list) => {
              const prev = list[index - 1];
              const showEllipsis = prev !== undefined && pageNumber - prev > 1;
              return (
                <span key={pageNumber} className="contents">
                  {showEllipsis ? (
                    <span className="px-1 text-muted-foreground">…</span>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant={pageNumber === paginated.page ? "default" : "outline"}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                </span>
              );
            })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!paginated.hasNext}
            onClick={() =>
              setPage((current) => Math.min(paginated.totalPages, current + 1))
            }
          >
            Next
          </Button>
        </nav>
      ) : null}
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
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
        {children}
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-none border px-2.5 py-1.5 text-xs transition-colors",
        active
          ? "border-foreground/30 bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
