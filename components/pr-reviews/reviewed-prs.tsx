import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { listReviewedRequestsAction } from "@/app/actions/pr-reviews";
import { ReportReviewedButton } from "@/components/pr-reviews/report-reviewed-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/pr-reviews/format";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Public history of queue PRs that Pull builders have reviewed, with every
 * builder who left a GitHub-verified review on each. Signed-in builders who
 * also reviewed one can add themselves — the same GitHub re-check as the
 * Browse tab's "I reviewed this".
 */
export async function ReviewedPrs() {
  const { requests, viewer } = await listReviewedRequestsAction();

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing reviewed yet. Once a builder reviews a PR from the Browse tab, it shows up here
        with everyone from Pull who reviewed it.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {requests.map((request) => {
        const viewerIsReviewer = viewer
          ? request.reviewers.some((reviewer) => reviewer.username === viewer.username)
          : false;
        const viewerIsAuthor = viewer
          ? request.authorLogin.toLowerCase() === viewer.githubUsername.toLowerCase()
          : false;

        return (
          <li
            key={request.id}
            className="flex flex-col gap-3 border-l-4 border-y border-r border-border border-l-signal bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {request.repoFullName} #{request.number}
                  </span>
                  {request.reviewedAt ? (
                    <span className="text-[11px] text-muted-foreground">
                      first reviewed {formatRelativeTime(request.reviewedAt)}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-sm font-medium text-foreground">{request.title}</p>
                <p className="text-xs text-muted-foreground">
                  by @{request.authorLogin}
                  {request.submittedByUsername ? (
                    <> · submitted by @{request.submittedByUsername}</>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Reviewed by {request.reviewers.length}{" "}
                  {request.reviewers.length === 1 ? "builder" : "builders"}:
                </span>
                {request.reviewers.map((reviewer) => (
                  <Link
                    key={reviewer.username}
                    href={`/u/${reviewer.username}`}
                    className="inline-flex items-center gap-1.5 text-xs text-foreground underline-offset-4 hover:underline"
                    title={`Reviewed ${formatRelativeTime(reviewer.reviewedAt)}`}
                  >
                    <Avatar size="sm">
                      {reviewer.avatar ? (
                        <AvatarImage src={reviewer.avatar} alt={reviewer.displayName} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {initialsFor(reviewer.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    @{reviewer.username}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <Button asChild size="sm" variant="outline">
                <a href={request.prUrl} target="_blank" rel="noreferrer">
                  View on GitHub
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
              {viewer && !viewerIsReviewer && !viewerIsAuthor ? (
                <ReportReviewedButton id={request.id} label="I reviewed this too" />
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
