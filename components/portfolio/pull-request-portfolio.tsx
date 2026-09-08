"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { PullRequestCadence } from "@/components/portfolio/pull-request-cadence";
import { PullRequestCard } from "@/components/portfolio/pull-request-card";
import { PullRequestReviewCard } from "@/components/portfolio/pull-request-review-card";
import { Button } from "@/components/ui/button";
import {
  CONTRIBUTION_TYPE_LABEL,
  PORTFOLIO_PAGE_SIZE,
  PORTFOLIO_SORT_LABEL,
  PORTFOLIO_STATUS_LABEL,
  filterPortfolioItems,
  filterReviewItems,
  getPortfolioLanguages,
  paginatePortfolioItems,
} from "@/lib/portfolio/filter";
import { cn } from "@/lib/utils";
import type {
  ContributionType,
  PortfolioCadence as PortfolioCadenceData,
  PortfolioRepoBreakdown,
  PortfolioSort,
  PullRequestPortfolioItem,
  PullRequestPortfolioStatus,
  PullRequestReviewItem,
} from "@/types/portfolio";

type PortfolioView = "authored" | "reviewed";

type PullRequestPortfolioProps = {
  items: PullRequestPortfolioItem[];
  reviews: PullRequestReviewItem[];
  topRepos: PortfolioRepoBreakdown[];
  cadence: PortfolioCadenceData;
  connected: boolean;
  stats: {
    total: number;
    merged: number;
    open: number;
    closed: number;
    repos: number;
    reviewsGiven: number;
  };
  /** Hide owner-only sync CTAs on public portfolio pages. */
  publicView?: boolean;
};

const CONTRIBUTION_TYPES = Object.keys(CONTRIBUTION_TYPE_LABEL) as ContributionType[];
const SORT_OPTIONS = Object.keys(PORTFOLIO_SORT_LABEL) as PortfolioSort[];

function readParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = searchParams.get(key);
  return (allowed as readonly string[]).includes(value ?? "") ? (value as T) : fallback;
}

export function PullRequestPortfolio({
  items,
  reviews,
  topRepos,
  cadence,
  connected,
  stats,
  publicView = false,
}: PullRequestPortfolioProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<PortfolioView>(
    readParam(searchParams, "view", ["authored", "reviewed"] as const, "authored"),
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<PullRequestPortfolioStatus | "all">(
    readParam(
      searchParams,
      "status",
      ["all", "merged", "open", "closed"] as const,
      "all",
    ),
  );
  const [language, setLanguage] = useState<string>(
    searchParams.get("language") ?? "all",
  );
  const [repo, setRepo] = useState<string>(searchParams.get("repo") ?? "all");
  const [contributionType, setContributionType] = useState<ContributionType | "all">(
    readParam(searchParams, "type", ["all", ...CONTRIBUTION_TYPES] as const, "all"),
  );
  const [mergedOnly, setMergedOnly] = useState(searchParams.get("merged") === "1");
  const [sort, setSort] = useState<PortfolioSort>(
    readParam(searchParams, "sort", SORT_OPTIONS, "merged"),
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1") || 1);
  const deferredQuery = useDeferredValue(query);

  const resetPage = useCallback(() => setPage(1), []);

  // Mirror filter state into the URL so a filtered view is shareable/bookmarkable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== "authored") params.set("view", view);
    if (deferredQuery) params.set("q", deferredQuery);
    if (status !== "all") params.set("status", status);
    if (language !== "all") params.set("language", language);
    if (repo !== "all") params.set("repo", repo);
    if (contributionType !== "all") params.set("type", contributionType);
    if (mergedOnly) params.set("merged", "1");
    if (sort !== "merged") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
    // Only the filter state itself should trigger a URL sync — router/pathname/
    // searchParams identity changes on every navigation and would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    view,
    deferredQuery,
    status,
    language,
    repo,
    contributionType,
    mergedOnly,
    sort,
    page,
  ]);

  const languages = useMemo(() => getPortfolioLanguages(items), [items]);

  const filtered = useMemo(
    () =>
      filterPortfolioItems(items, {
        query: deferredQuery,
        status,
        language,
        repo,
        contributionType,
        mergedOnly,
        sort,
      }),
    [items, deferredQuery, status, language, repo, contributionType, mergedOnly, sort],
  );

  const filteredReviews = useMemo(
    () => filterReviewItems(reviews, { query: deferredQuery, repo }),
    [reviews, deferredQuery, repo],
  );

  const paginatedAuthored = useMemo(
    () => paginatePortfolioItems(filtered, page, PORTFOLIO_PAGE_SIZE),
    [filtered, page],
  );
  const paginatedReviews = useMemo(
    () => paginatePortfolioItems(filteredReviews, page, PORTFOLIO_PAGE_SIZE),
    [filteredReviews, page],
  );

  const paginated = view === "authored" ? paginatedAuthored : paginatedReviews;

  if (!connected) {
    return (
      <EmptyState
        title={
          publicView
            ? "No GitHub portfolio yet"
            : "Connect GitHub to build your PR portfolio"
        }
        description={
          publicView
            ? "This builder hasn't synced GitHub pull requests to Pull."
            : "Sync GitHub to import pull requests, merged contributions, and review activity."
        }
        actionLabel={publicView ? undefined : "Open GitHub settings"}
        actionHref={publicView ? undefined : "/settings/github"}
      />
    );
  }

  if (items.length === 0 && reviews.length === 0) {
    return (
      <EmptyState
        title="No pull requests synced yet"
        description={
          publicView
            ? "Once this builder syncs GitHub, their pull requests will appear here."
            : "Run a GitHub sync to import your authored pull requests into Pull."
        }
        actionLabel={publicView ? undefined : "Sync GitHub"}
        actionHref={publicView ? undefined : "/settings/github"}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Pull requests" value={stats.total} />
        <Stat label="Merged" value={stats.merged} highlight />
        <Stat label="Open" value={stats.open} />
        <Stat label="Repositories" value={stats.repos} />
        <Stat label="Reviews given" value={stats.reviewsGiven} />
      </div>

      {items.length > 0 ? <PullRequestCadence cadence={cadence} /> : null}

      {reviews.length > 0 ? (
        <nav
          className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]"
          aria-label="Portfolio view"
        >
          <FilterChip
            active={view === "authored"}
            onClick={() => {
              setView("authored");
              resetPage();
            }}
          >
            Authored ({stats.total})
          </FilterChip>
          <FilterChip
            active={view === "reviewed"}
            onClick={() => {
              setView("reviewed");
              resetPage();
            }}
          >
            Reviewed ({stats.reviewsGiven})
          </FilterChip>
        </nav>
      ) : null}

      <div className="space-y-4 rounded-none border border-border bg-card p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search pull requests</span>
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
            placeholder="Search by title, repo, label, or language…"
            className="h-10 w-full rounded-none border border-border bg-transparent pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>

        {view === "authored" ? (
          <>
            <FilterRow label="Sort by">
              {SORT_OPTIONS.map((item) => (
                <FilterChip
                  key={item}
                  active={sort === item}
                  onClick={() => {
                    setSort(item);
                    resetPage();
                  }}
                >
                  {PORTFOLIO_SORT_LABEL[item]}
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Status">
              {(["all", "merged", "open", "closed"] as const).map((item) => (
                <FilterChip
                  key={item}
                  active={status === item && !mergedOnly}
                  onClick={() => {
                    setStatus(item);
                    setMergedOnly(false);
                    resetPage();
                  }}
                >
                  {PORTFOLIO_STATUS_LABEL[item]}
                </FilterChip>
              ))}
              <FilterChip
                active={mergedOnly}
                onClick={() => {
                  setMergedOnly(true);
                  setStatus("all");
                  resetPage();
                }}
              >
                Highlight merged
              </FilterChip>
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

            <FilterRow label="Contribution type">
              <FilterChip
                active={contributionType === "all"}
                onClick={() => {
                  setContributionType("all");
                  resetPage();
                }}
              >
                All
              </FilterChip>
              {CONTRIBUTION_TYPES.map((item) => (
                <FilterChip
                  key={item}
                  active={contributionType === item}
                  onClick={() => {
                    setContributionType(item);
                    resetPage();
                  }}
                >
                  {CONTRIBUTION_TYPE_LABEL[item]}
                </FilterChip>
              ))}
            </FilterRow>
          </>
        ) : null}

        {topRepos.length > 1 ? (
          <FilterRow label="Top repositories">
            <FilterChip
              active={repo === "all"}
              onClick={() => {
                setRepo("all");
                resetPage();
              }}
            >
              All
            </FilterChip>
            {topRepos.map((item) => (
              <FilterChip
                key={item.repoFullName}
                active={repo === item.repoFullName}
                onClick={() => {
                  setRepo(item.repoFullName);
                  resetPage();
                }}
              >
                {item.repoFullName} ({item.count})
              </FilterChip>
            ))}
          </FilterRow>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {paginated.items.length} of {paginated.total}{" "}
        {view === "authored" ? "pull requests" : "reviewed pull requests"}
      </p>

      {paginated.items.length === 0 ? (
        <EmptyState
          title={
            view === "authored"
              ? "No matching pull requests"
              : "No reviewed pull requests"
          }
          description={
            view === "authored"
              ? "Try a different search or clear filters."
              : "PRs this builder has reviewed for others will show up here."
          }
          actionLabel={view === "authored" ? "Clear filters" : undefined}
          onAction={
            view === "authored"
              ? () => {
                  setQuery("");
                  setStatus("all");
                  setLanguage("all");
                  setRepo("all");
                  setContributionType("all");
                  setMergedOnly(false);
                  setSort("merged");
                  setPage(1);
                }
              : undefined
          }
        />
      ) : (
        <ul className="grid gap-4">
          {view === "authored"
            ? paginatedAuthored.items.map((item, index) => (
                <li key={item.id}>
                  <PullRequestCard item={item} index={index} />
                </li>
              ))
            : paginatedReviews.items.map((item, index) => (
                <li key={item.id}>
                  <PullRequestReviewCard item={item} index={index} />
                </li>
              ))}
        </ul>
      )}

      {paginated.totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Portfolio pagination"
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

      {!publicView ? (
        <p className="text-center text-sm text-muted-foreground">
          Share your public record from your{" "}
          <Link href="/settings/profile" className="underline underline-offset-4">
            profile settings
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-none border px-3 py-3",
        highlight ? "border-ink/25 bg-signal/15" : "border-border bg-transparent",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
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
