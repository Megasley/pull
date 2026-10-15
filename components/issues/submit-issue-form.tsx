"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { previewIssueSubmissionAction, submitIssueAction } from "@/app/actions/issue-submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ISSUE_CATEGORY_SINGULAR } from "@/lib/issues/engine";
import type { IssueSubmissionPreview } from "@/lib/issues/submissions";

export function SubmitIssueForm() {
  const router = useRouter();
  const [issueUrl, setIssueUrl] = useState("");
  const [preview, setPreview] = useState<IssueSubmissionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadPreview() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await previewIssueSubmissionAction(issueUrl);
      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/sign-in?next=/issues/submit");
          return;
        }
        setError(result.error);
        return;
      }
      setPreview(result.preview);
    });
  }

  function confirmSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitIssueAction(issueUrl);
      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/sign-in?next=/issues/submit");
          return;
        }
        setError(result.error);
        return;
      }
      setIssueUrl("");
      setPreview(null);
      setMessage("Submitted. An admin will review it, and it goes live once approved.");
      router.refresh();
    });
  }

  function editUrl() {
    setPreview(null);
    setError(null);
  }

  return (
    <div className="space-y-3 rounded-none border border-border bg-card p-4">
      <div>
        <label htmlFor="submit-issue-url" className="text-sm font-medium">
          Suggest a GitHub issue
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste an open issue from a public repository. We pull its details from GitHub and
          classify it from its labels, then an admin approves it before it shows up in
          recommendations. It disappears automatically once it&apos;s closed.
        </p>
      </div>

      {!preview ? (
        <input
          id="submit-issue-url"
          type="url"
          value={issueUrl}
          onChange={(event) => setIssueUrl(event.target.value)}
          placeholder="https://github.com/owner/repo/issues/123"
          disabled={pending}
          className="w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      ) : (
        <div className="space-y-2 border border-border bg-background p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{ISSUE_CATEGORY_SINGULAR[preview.category]}</Badge>
            <Badge variant="outline">{preview.difficulty}</Badge>
            {preview.language ? <Badge variant="outline">{preview.language}</Badge> : null}
            <span className="font-mono text-[11px] text-muted-foreground">
              {preview.repoFullName} #{preview.number}
            </span>
          </div>
          <p className="text-sm font-medium break-words text-foreground">{preview.title}</p>
          <p className="text-xs break-words text-muted-foreground">{preview.summary}</p>
          {preview.labels.length > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              GitHub labels: {preview.labels.join(", ")}
            </p>
          ) : null}
        </div>
      )}

      {error ? (
        <p
          className="rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {preview ? (
          <>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={editUrl}>
              Edit URL
            </Button>
            <Button type="button" size="sm" loading={pending} onClick={confirmSubmit}>
              Submit for approval
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={issueUrl.trim().length === 0}
            onClick={loadPreview}
          >
            Preview
          </Button>
        )}
      </div>
    </div>
  );
}
