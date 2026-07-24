import { ExternalLink, FileDiff, GitMerge, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CONTRIBUTION_TYPE_LABEL } from "@/lib/portfolio/filter";
import { cn } from "@/lib/utils";
import type { PullRequestPortfolioItem } from "@/types/portfolio";

type PullRequestCardProps = {
  item: PullRequestPortfolioItem;
  index?: number;
};

export function PullRequestCard({ item, index = 0 }: PullRequestCardProps) {
  return (
    <a
      href={item.htmlUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group animate-fade-in-up block rounded-none border p-5 transition-[background-color,border-color,transform] duration-300",
        item.merged
          ? "border-ink/25 bg-signal/15 hover:border-ink/40 hover:bg-signal/25"
          : "border-border bg-card hover:border-border hover:bg-card",
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.merged ? (
              <Badge className="bg-signal text-ink hover:bg-signal/90">
                <GitMerge className="size-3" aria-hidden />
                Merged
              </Badge>
            ) : (
              <Badge variant={item.status === "open" ? "secondary" : "outline"}>
                {item.status === "open" ? "Open" : "Closed"}
              </Badge>
            )}
            <Badge variant="outline">
              {CONTRIBUTION_TYPE_LABEL[item.contributionType]}
            </Badge>
            {item.language ? (
              <Badge variant="outline">{item.language}</Badge>
            ) : null}
            <span className="font-mono text-[11px] text-muted-foreground">
              #{item.number}
            </span>
          </div>
          <h3 className="mt-2 break-words text-base font-semibold tracking-tight group-hover:underline">
            {item.title}
          </h3>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {item.repoFullName}
          </p>
        </div>
        <ExternalLink
          className="size-4 shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <FileDiff className="size-3.5" aria-hidden />
          {item.filesChanged} files
          {item.additions || item.deletions
            ? ` · +${item.additions}/-${item.deletions}`
            : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5" aria-hidden />
          {item.reviewComments} comments
        </span>
        <span className="ml-auto">
          {item.merged && item.mergedAt
            ? `Merged ${new Date(item.mergedAt).toLocaleDateString()}`
            : item.createdAt
              ? `Opened ${new Date(item.createdAt).toLocaleDateString()}`
              : null}
        </span>
      </div>

      {item.labels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.labels.slice(0, 5).map((label) => (
            <span
              key={label}
              className="rounded-none border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </a>
  );
}
