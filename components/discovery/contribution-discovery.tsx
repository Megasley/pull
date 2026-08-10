"use client";

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { DiscoveryRepoCard } from "@/components/discovery/discovery-repo-card";
import { Button } from "@/components/ui/button";
import {
  DISCOVERY_DIFFICULTY_OPTIONS,
  DISCOVERY_PAGE_SIZE,
  DISCOVERY_SIZE_OPTIONS,
  filterDiscoveryRepositories,
  getDiscoveryLanguages,
  getDiscoveryTopics,
  paginateDiscoveryRepositories,
} from "@/lib/discovery/catalog";
import {
  getBookmarkedDiscoveryIds,
  getServerDiscoveryBookmarks,
  subscribeDiscoveryBookmarks,
} from "@/lib/discovery/bookmarks";
import { cn } from "@/lib/utils";
import type { DiscoveryRecommendation, DiscoveryRepository } from "@/types/discovery";
import type { RoadmapDifficulty } from "@/types";
import type { RepositorySize } from "@/types/discovery";

type ContributionDiscoveryProps = {
  repositories: DiscoveryRepository[];
  recommendations: DiscoveryRecommendation[];
};

const difficultyLabels: Record<RoadmapDifficulty | "all", string> = {
  all: "All levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const sizeLabels: Record<RepositorySize | "all", string> = {
  all: "All sizes",
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function ContributionDiscovery({
  repositories,
  recommendations,
}: ContributionDiscoveryProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string | "all">("all");
  const [topic, setTopic] = useState<string | "all">("all");
  const [difficulty, setDifficulty] = useState<RoadmapDifficulty | "all">("all");
  const [size, setSize] = useState<RepositorySize | "all">("all");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const bookmarkedIds = useSyncExternalStore(
    subscribeDiscoveryBookmarks,
    getBookmarkedDiscoveryIds,
    getServerDiscoveryBookmarks,
  );

  const languages = useMemo(() => getDiscoveryLanguages(), []);
  const topics = useMemo(() => getDiscoveryTopics(), []);

  const filtered = useMemo(
    () =>
      filterDiscoveryRepositories(
        repositories,
        {
          query: deferredQuery,
          language,
          topic,
          difficulty,
          size,
          bookmarkedOnly,
        },
        bookmarkedIds,
      ),
    [
      repositories,
      deferredQuery,
      language,
      topic,
      difficulty,
      size,
      bookmarkedOnly,
      bookmarkedIds,
    ],
  );

  const paginated = useMemo(
    () => paginateDiscoveryRepositories(filtered, page, DISCOVERY_PAGE_SIZE),
    [filtered, page],
  );

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-10">
      {recommendations.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Recommended for you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked from your completed roadmaps, GitHub languages, and builder level.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {recommendations.map((item, index) => (
              <li key={item.repository.id}>
                <DiscoveryRepoCard
                  repository={item.repository}
                  reasons={item.reasons}
                  index={index}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Browse repositories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter by language, topic, difficulty, and size. Bookmark targets to revisit
            later.
          </p>
        </div>

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
              placeholder="Search by repo, maintainer, label, or topic…"
              className="h-10 w-full rounded-none border border-border bg-transparent pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>

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

          <FilterRow label="Topic">
            <FilterChip
              active={topic === "all"}
              onClick={() => {
                setTopic("all");
                resetPage();
              }}
            >
              All
            </FilterChip>
            {topics.map((item) => (
              <FilterChip
                key={item}
                active={topic === item}
                onClick={() => {
                  setTopic(item);
                  resetPage();
                }}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Difficulty">
            {DISCOVERY_DIFFICULTY_OPTIONS.map((item) => (
              <FilterChip
                key={item}
                active={difficulty === item}
                onClick={() => {
                  setDifficulty(item);
                  resetPage();
                }}
              >
                {difficultyLabels[item]}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Repository size">
            {DISCOVERY_SIZE_OPTIONS.map((item) => (
              <FilterChip
                key={item}
                active={size === item}
                onClick={() => {
                  setSize(item);
                  resetPage();
                }}
              >
                {sizeLabels[item]}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Saved">
            <FilterChip
              active={!bookmarkedOnly}
              onClick={() => {
                setBookmarkedOnly(false);
                resetPage();
              }}
            >
              All repos
            </FilterChip>
            <FilterChip
              active={bookmarkedOnly}
              onClick={() => {
                setBookmarkedOnly(true);
                resetPage();
              }}
            >
              Bookmarks ({bookmarkedIds.length})
            </FilterChip>
          </FilterRow>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {paginated.items.length} of {paginated.total} repositories
        </p>

        {paginated.items.length === 0 ? (
          <EmptyState
            title="No repositories match"
            description="Try clearing filters or bookmarking a few targets first."
            actionLabel="Clear filters"
            onAction={() => {
              setQuery("");
              setLanguage("all");
              setTopic("all");
              setDifficulty("all");
              setSize("all");
              setBookmarkedOnly(false);
              setPage(1);
            }}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginated.items.map((repository, index) => (
              <li key={repository.id}>
                <DiscoveryRepoCard repository={repository} index={index} />
              </li>
            ))}
          </ul>
        )}

        {paginated.totalPages > 1 ? (
          <nav
            className="flex flex-wrap items-center justify-center gap-2"
            aria-label="Discovery pagination"
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
            <span className="px-2 text-sm text-muted-foreground">
              Page {paginated.page} / {paginated.totalPages}
            </span>
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
      </section>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
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
