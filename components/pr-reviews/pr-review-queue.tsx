"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { ReportReviewedButton } from "@/components/pr-reviews/report-reviewed-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  formatSubmittedByLabel,
  languageDotColor,
  prSizeLabel,
} from "@/lib/pr-reviews/format";
import type { PrReviewRequestRecord } from "@/lib/pr-reviews/repository";
import type { DiscoveryTrack } from "@/types/discovery";

const TRACK_LABEL: Record<DiscoveryTrack, string> = {
  bitcoin: "Bitcoin",
  lightning: "Lightning",
};

type SortField = "submitted" | "opened";
type SortDirection = "oldest" | "newest";

const PAGE_SIZE = 10;

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
          ? "border-ink/30 bg-signal text-signal-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PrReviewQueue({
  requests,
  viewerSignedIn,
}: {
  requests: PrReviewRequestRecord[];
  viewerSignedIn: boolean;
}) {
  const [track, setTrack] = useState<DiscoveryTrack | "all">("all");
  const [language, setLanguage] = useState<string | "all">("all");
  const [sortField, setSortField] = useState<SortField>("submitted");
  const [sortDirection, setSortDirection] = useState<SortDirection>("oldest");
  const [page, setPage] = useState(1);

  function selectTrack(value: DiscoveryTrack | "all") {
    setTrack(value);
    setPage(1);
  }

  function selectLanguage(value: string | "all") {
    setLanguage(value);
    setPage(1);
  }

  function selectSortField(value: SortField) {
    setSortField(value);
    setPage(1);
  }

  function selectSortDirection(value: SortDirection) {
    setSortDirection(value);
    setPage(1);
  }

  const availableTracks = useMemo(() => {
    const set = new Set<DiscoveryTrack>();
    for (const request of requests) {
      for (const t of request.tracks) set.add(t);
    }
    return [...set];
  }, [requests]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    for (const request of requests) {
      if (request.language) set.add(request.language);
    }
    return [...set].sort();
  }, [requests]);

  const hasUncataloged = requests.some((request) => !request.language);

  const filtered = useMemo(() => {
    const matches = requests.filter((request) => {
      if (track !== "all" && !request.tracks.includes(track)) return false;
      if (language === "other" && request.language) return false;
      if (language !== "all" && language !== "other" && request.language !== language) {
        return false;
      }
      return true;
    });

    // Peer-submitted requests always rank above ecosystem/admin-curated ones
    // (confirmed design decision); the sort controls only affect the
    // secondary tie-break by time within each group.
    return [...matches].sort((a, b) => {
      const groupA = a.sourceType === "peer_submitted" ? 0 : 1;
      const groupB = b.sourceType === "peer_submitted" ? 0 : 1;
      if (groupA !== groupB) return groupA - groupB;

      const timeOf = (request: PrReviewRequestRecord) =>
        Date.parse(
          sortField === "opened"
            ? (request.prCreatedAt ?? request.createdAt)
            : request.createdAt,
        );
      const timeA = timeOf(a);
      const timeB = timeOf(b);
      return sortDirection === "oldest" ? timeA - timeB : timeB - timeA;
    });
  }, [requests, track, language, sortField, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing waiting for review right now. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-border pb-6">
        {availableTracks.length > 0 ? (
          <FilterRow label="Ecosystem">
            <FilterChip active={track === "all"} onClick={() => selectTrack("all")}>
              All
            </FilterChip>
            {availableTracks.map((item) => (
              <FilterChip key={item} active={track === item} onClick={() => selectTrack(item)}>
                {TRACK_LABEL[item]}
              </FilterChip>
            ))}
          </FilterRow>
        ) : null}

        {availableLanguages.length > 0 ? (
          <FilterRow label="Language">
            <FilterChip active={language === "all"} onClick={() => selectLanguage("all")}>
              All
            </FilterChip>
            {availableLanguages.map((item) => (
              <FilterChip
                key={item}
                active={language === item}
                onClick={() => selectLanguage(item)}
              >
                {item}
              </FilterChip>
            ))}
            {hasUncataloged ? (
              <FilterChip active={language === "other"} onClick={() => selectLanguage("other")}>
                Other
              </FilterChip>
            ) : null}
          </FilterRow>
        ) : null}

        <FilterRow label="Sort by">
          <FilterChip
            active={sortField === "submitted"}
            onClick={() => selectSortField("submitted")}
          >
            Submitted to Pull
          </FilterChip>
          <FilterChip active={sortField === "opened"} onClick={() => selectSortField("opened")}>
            PR opened
          </FilterChip>
        </FilterRow>

        <FilterRow label="Order">
          <FilterChip
            active={sortDirection === "oldest"}
            onClick={() => selectSortDirection("oldest")}
          >
            Oldest first
          </FilterChip>
          <FilterChip
            active={sortDirection === "newest"}
            onClick={() => selectSortDirection("newest")}
          >
            Newest first
          </FilterChip>
        </FilterRow>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No PRs match these filters.</p>
      ) : (
        <ol className="space-y-3">
          {paginated.map((request) => {
            const submittedByLabel = formatSubmittedByLabel(request);
            return (
              <li
                key={request.id}
                className={cn(
                  "flex flex-col gap-3 border-l-4 border-y border-r border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
                  request.sourceType === "peer_submitted" ? "border-l-signal" : "border-l-ink/15",
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px]",
                        request.sourceType === "peer_submitted"
                          ? "border-ink/20 bg-signal/20 text-foreground"
                          : "border-border bg-muted/50 text-muted-foreground",
                      )}
                    >
                      {request.sourceType === "peer_submitted" ? "Peer submitted" : "Ecosystem"}
                    </Badge>
                    {request.language ? (
                      <span className="inline-flex items-center gap-1.5 border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: languageDotColor(request.language) }}
                          aria-hidden
                        />
                        {request.language}
                      </span>
                    ) : null}
                    {request.additions !== null && request.deletions !== null ? (
                      <span
                        className="border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        title={`+${request.additions} -${request.deletions}${request.filesChanged !== null ? ` · ${request.filesChanged} file${request.filesChanged === 1 ? "" : "s"}` : ""}`}
                      >
                        {prSizeLabel(request.additions, request.deletions)}
                      </span>
                    ) : null}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {request.repoFullName} #{request.number}
                    </span>
                    {request.prCreatedAt ? (
                      <span className="text-[11px] text-muted-foreground">
                        opened {formatRelativeTime(request.prCreatedAt)}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">{request.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by @{request.authorLogin} ·{" "}
                    {submittedByLabel
                      ? `${submittedByLabel} ${formatRelativeTime(request.createdAt)}`
                      : `added to Pull ${formatRelativeTime(request.createdAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Button asChild size="sm">
                    <a href={request.prUrl} target="_blank" rel="noreferrer">
                      Review on GitHub
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </Button>
                  {viewerSignedIn ? <ReportReviewedButton id={request.id} /> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
