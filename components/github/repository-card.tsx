import { CircleDot, ExternalLink, GitFork, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CONTRIBUTION_STATUS_LABEL,
  formatRelativeUpdated,
  getRepoContributionStatus,
} from "@/lib/github/explorer";
import { cn } from "@/lib/utils";
import type { GithubRepositoryRecord } from "@/types/github";

type RepositoryCardProps = {
  repository: GithubRepositoryRecord;
  className?: string;
};

export function RepositoryCard({ repository, className }: RepositoryCardProps) {
  const status = getRepoContributionStatus(repository);
  const updated = formatRelativeUpdated(
    repository.pushedAt ?? repository.githubUpdatedAt,
  );

  return (
    <a
      href={repository.htmlUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex h-full flex-col rounded-none border border-border bg-card p-5 transition-[background-color,border-color,transform] duration-300 hover:border-border hover:bg-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight group-hover:underline">
              {repository.name}
            </h3>
            {repository.isPrivate ? (
              <Badge variant="outline" className="text-[10px]">
                Private
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {repository.fullName}
          </p>
        </div>
        <ExternalLink
          className="size-4 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
        {repository.description?.trim() || "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[11px]">
          {CONTRIBUTION_STATUS_LABEL[status]}
        </Badge>
        {repository.language ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2 rounded-full bg-foreground/70"
              aria-hidden
            />
            {repository.language}
          </span>
        ) : null}
        {repository.licenseSpdx ? (
          <span className="text-xs text-muted-foreground">
            {repository.licenseSpdx}
          </span>
        ) : null}
      </div>

      {repository.topics.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {repository.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="rounded-none border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {topic}
            </span>
          ))}
          {repository.topics.length > 4 ? (
            <span className="text-[10px] text-muted-foreground">
              +{repository.topics.length - 4}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5" aria-hidden />
          {repository.stargazersCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3.5" aria-hidden />
          {repository.forksCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <CircleDot className="size-3.5" aria-hidden />
          {repository.openIssuesCount}
        </span>
        <span className="ml-auto">{updated}</span>
      </div>
    </a>
  );
}
