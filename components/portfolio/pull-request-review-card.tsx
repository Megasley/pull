import { ExternalLink, GitMerge } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PullRequestReviewItem } from "@/types/portfolio";

type PullRequestReviewCardProps = {
  item: PullRequestReviewItem;
  index?: number;
};

export function PullRequestReviewCard({ item, index = 0 }: PullRequestReviewCardProps) {
  return (
    <a
      href={item.htmlUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group animate-fade-in-up block rounded-none border border-border bg-card p-5 transition-[background-color,border-color] duration-300 hover:bg-card",
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.merged ? (
              <Badge className="bg-signal text-signal-foreground hover:bg-signal/90">
                <GitMerge className="size-3" aria-hidden />
                Merged
              </Badge>
            ) : (
              <Badge variant={item.status === "open" ? "secondary" : "outline"}>
                {item.status === "open" ? "Open" : "Closed"}
              </Badge>
            )}
            {item.language ? <Badge variant="outline">{item.language}</Badge> : null}
            <span className="font-mono text-[11px] text-muted-foreground">
              #{item.number}
            </span>
          </div>
          <h3 className="mt-2 break-words text-base font-semibold tracking-tight group-hover:underline">
            {item.title}
          </h3>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {item.repoFullName}
            {item.authorLogin ? ` · by @${item.authorLogin}` : ""}
          </p>
        </div>
        <ExternalLink
          className="size-4 shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>

      {item.updatedAt ? (
        <p className="mt-4 text-right text-xs text-muted-foreground">
          Reviewed {new Date(item.updatedAt).toLocaleDateString()}
        </p>
      ) : null}
    </a>
  );
}
