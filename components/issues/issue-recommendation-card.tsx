import { Clock3, ExternalLink } from "lucide-react";

import {
  IssueDismissButton,
  IssueSaveButton,
} from "@/components/issues/issue-actions";
import { Badge } from "@/components/ui/badge";
import { ISSUE_CATEGORY_SINGULAR } from "@/lib/issues/engine";
import { cn } from "@/lib/utils";
import type { IssueRecommendation } from "@/types/issues";

type IssueRecommendationCardProps = {
  recommendation: IssueRecommendation;
  index?: number;
  className?: string;
};

export function IssueRecommendationCard({
  recommendation,
  index = 0,
  className,
}: IssueRecommendationCardProps) {
  const { issue, reasons, repositoryName, repositoryFullName, repositoryUrl } =
    recommendation;

  return (
    <article
      className={cn(
        "animate-fade-in-up flex h-full flex-col rounded-none border border-border bg-card p-5 transition-[background-color,border-color] duration-300 hover:border-border hover:bg-card",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {ISSUE_CATEGORY_SINGULAR[issue.category]}
        </Badge>
        <Badge variant="outline">{issue.difficulty}</Badge>
        <Badge variant="outline">{issue.language}</Badge>
        <span className="font-mono text-[11px] text-muted-foreground">
          #{issue.number}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold tracking-tight break-words">
        {issue.title}
      </h3>
      <p className="mt-1 min-w-0 text-xs text-muted-foreground">
        <a
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          {repositoryName}
        </a>
        <span className="mx-1.5">·</span>
        <span className="block truncate font-mono sm:inline">
          {repositoryFullName}
        </span>
      </p>

      <p className="mt-3 flex-1 text-sm break-words text-muted-foreground">
        {issue.summary}
      </p>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3 className="size-3.5" aria-hidden />
        ~{issue.estimatedHours}h estimated
      </p>

      {issue.labels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {issue.labels.map((label) => (
            <span
              key={label}
              className="rounded-none border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}

      <ul className="mt-3 space-y-1 rounded-none border border-border bg-transparent px-3 py-2 text-[11px] text-muted-foreground">
        {reasons.map((reason) => (
          <li key={reason}>· {reason}</li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <a
          href={`${issue.url}/${issue.number}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
        >
          Open issue
          <ExternalLink className="size-3" aria-hidden />
        </a>
        <div className="ml-auto flex flex-wrap gap-2">
          <IssueSaveButton issueId={issue.id} />
          <IssueDismissButton issueId={issue.id} />
        </div>
      </div>
    </article>
  );
}
