import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { listMyIssueSubmissionsAction } from "@/app/actions/issue-submissions";
import { PageHeader } from "@/components/design-system";
import { SubmitIssueForm } from "@/components/issues/submit-issue-form";
import { SiteContainer } from "@/components/layout/site-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import {
  SUBMITTED_ISSUE_STATUS_CLASS,
  SUBMITTED_ISSUE_STATUS_LABEL,
} from "@/lib/issues/submission-format";
import { formatRelativeTime } from "@/lib/pr-reviews/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Submit an issue",
  description:
    "Suggest an open GitHub issue for Pull's issue recommendations. Admins approve submissions before they go live.",
};

export default async function SubmitIssuePage() {
  const profile = await bootstrapCurrentUserProfile();

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="contribute // issues // submit"
        title="Submit an issue"
        description="Know an open issue that would be a good contribution for Pull builders? Suggest it here. It's checked by an admin before it shows up in recommendations."
        actions={
          <Button asChild variant="outline">
            <Link href="/issues">ls ./issues</Link>
          </Button>
        }
      />

      <div className="mt-8 max-w-3xl space-y-8">
        {profile ? (
          <>
            <SubmitIssueForm />
            <MySubmittedIssues />
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Sign in with GitHub to submit an issue.
            </p>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href="/sign-in?next=/issues/submit">Sign in</Link>
            </Button>
          </div>
        )}
      </div>
    </SiteContainer>
  );
}

async function MySubmittedIssues() {
  const { submissions } = await listMyIssueSubmissionsAction();
  if (submissions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Your submissions
      </p>
      <ol className="space-y-3">
        {submissions.map((submission) => (
          <li
            key={submission.id}
            className={cn(
              "flex flex-col gap-3 border-l-4 border-y border-r border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
              submission.status === "approved" ? "border-l-signal" : "border-l-ink/15",
            )}
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn("text-[10px]", SUBMITTED_ISSUE_STATUS_CLASS[submission.status])}
                >
                  {SUBMITTED_ISSUE_STATUS_LABEL[submission.status]}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {submission.repoFullName} #{submission.number}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  submitted {formatRelativeTime(submission.createdAt)}
                </span>
              </div>
              <p className="truncate text-sm font-medium text-foreground">{submission.title}</p>
              {submission.status === "rejected" && submission.rejectionReason ? (
                <p className="text-xs text-muted-foreground">
                  Reason: {submission.rejectionReason}
                </p>
              ) : null}
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <a href={submission.issueUrl} target="_blank" rel="noreferrer">
                View on GitHub
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
          </li>
        ))}
      </ol>
    </section>
  );
}
