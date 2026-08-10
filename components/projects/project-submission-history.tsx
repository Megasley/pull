import { ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import {
  SUBMISSION_STATUS_LABELS,
  type ProjectSubmissionRecord,
  type SubmissionStatus,
} from "@/types/submission";

const statusVariant: Record<SubmissionStatus, "secondary" | "outline" | "default"> = {
  draft: "outline",
  submitted: "secondary",
  under_review: "secondary",
  needs_changes: "outline",
  approved: "default",
  rejected: "outline",
};

type ProjectSubmissionHistoryProps = {
  submissions: ProjectSubmissionRecord[];
};

export function ProjectSubmissionHistory({
  submissions,
}: ProjectSubmissionHistoryProps) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No submissions yet"
        description="Save a draft or submit your repository when you are ready for review."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {submissions.map((submission) => (
        <li
          key={submission.id}
          className="rounded-none border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[submission.status]}>
                  {SUBMISSION_STATUS_LABELS[submission.status]}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Updated {formatDate(submission.updatedAt)}
                </span>
              </div>
              {submission.repoUrl ? (
                <a
                  href={submission.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-foreground underline-offset-4 hover:underline"
                >
                  {submission.repoUrl}
                  <ExternalLink
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No repository URL yet</p>
              )}
            </div>
            {submission.submittedAt ? (
              <p className="text-xs text-muted-foreground">
                Submitted {formatDate(submission.submittedAt)}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {submission.liveDemoUrl ? (
              <MetaLink href={submission.liveDemoUrl} label="Live demo" />
            ) : null}
            {submission.videoDemoUrl ? (
              <MetaLink href={submission.videoDemoUrl} label="Video" />
            ) : null}
            {submission.screenshotUrls.length > 0 ? (
              <span>{submission.screenshotUrls.length} screenshot(s)</span>
            ) : null}
          </div>

          {submission.notes ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {submission.notes}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function MetaLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline-offset-4 hover:underline"
    >
      {label}
    </a>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
