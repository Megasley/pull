import { Clock3, ExternalLink, HeartPulse, Tag } from "lucide-react";

import { DiscoveryBookmarkButton } from "@/components/discovery/discovery-bookmark-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DiscoveryRepository } from "@/types/discovery";

const HEALTH_LABEL = {
  excellent: "Excellent health",
  good: "Good health",
  fair: "Fair health",
} as const;

const SIZE_LABEL = {
  small: "Small",
  medium: "Medium",
  large: "Large",
} as const;

type DiscoveryRepoCardProps = {
  repository: DiscoveryRepository;
  reasons?: string[];
  className?: string;
  index?: number;
};

export function DiscoveryRepoCard({
  repository,
  reasons,
  className,
  index = 0,
}: DiscoveryRepoCardProps) {
  return (
    <article
      className={cn(
        "animate-fade-in-up flex h-full flex-col rounded-none border border-border bg-card p-5 transition-[background-color,border-color,transform] duration-300 hover:border-border hover:bg-card",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {repository.name}
          </h3>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {repository.repository}
          </p>
        </div>
        <DiscoveryBookmarkButton id={repository.id} compact />
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
        {repository.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">{repository.difficulty}</Badge>
        <Badge variant="outline">{repository.language}</Badge>
        <Badge variant="outline">{SIZE_LABEL[repository.size]}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="rounded-none border border-border bg-transparent px-2.5 py-2">
          <dt>Good first issues</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {repository.goodFirstIssues}
          </dd>
        </div>
        <div className="rounded-none border border-border bg-transparent px-2.5 py-2">
          <dt>Help wanted</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {repository.helpWanted}
          </dd>
        </div>
      </dl>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <p className="flex min-w-0 items-start gap-1.5">
          <Tag className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">
            Maintainer: {repository.maintainer}
          </span>
        </p>
        <p className="flex min-w-0 items-start gap-1.5">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">
            Avg review ~{repository.averageReviewDays}d ·{" "}
            {repository.estimatedDifficulty}
          </span>
        </p>
        <p className="flex min-w-0 items-start gap-1.5">
          <HeartPulse className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{HEALTH_LABEL[repository.health]}</span>
        </p>
      </div>

      {repository.labels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {repository.labels.slice(0, 4).map((label) => (
            <span
              key={label}
              className="rounded-none border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {reasons && reasons.length > 0 ? (
        <ul className="mt-3 space-y-1 rounded-none border border-border bg-transparent px-3 py-2 text-[11px] text-muted-foreground">
          {reasons.map((reason) => (
            <li key={reason}>· {reason}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <a
          href={repository.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
        >
          Repository
          <ExternalLink className="size-3" aria-hidden />
        </a>
        <a
          href={repository.issuesUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
        >
          Issues
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </article>
  );
}
