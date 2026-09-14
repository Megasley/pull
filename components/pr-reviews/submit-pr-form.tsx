"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { previewPrForReviewAction, submitPrForReviewAction } from "@/app/actions/pr-reviews";
import { Button } from "@/components/ui/button";
import { languageDotColor, prSizeLabel, REVIEW_STATUS_LABEL } from "@/lib/pr-reviews/format";
import type { PrReviewRequestRecord } from "@/lib/pr-reviews/repository";

type Preview = {
  repoFullName: string;
  number: number;
  title: string;
  authorLogin: string;
  prCreatedAt: string;
  language: string | null;
  existingStatus: PrReviewRequestRecord["status"] | null;
  additions: number;
  deletions: number;
};

export function SubmitPrForm() {
  const router = useRouter();
  const [prUrl, setPrUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadPreview() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await previewPrForReviewAction(prUrl);

      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/sign-in?next=/pr-reviews");
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
      const result = await submitPrForReviewAction(prUrl);

      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/sign-in?next=/pr-reviews");
          return;
        }
        setError(result.error);
        return;
      }

      setPrUrl("");
      setPreview(null);
      setMessage("Added to the review queue.");
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
        <label htmlFor="pr-review-url" className="text-sm font-medium">
          Ask peers to review your PR
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste a GitHub pull request URL. You won&apos;t see your own PR in the queue below.
          Reviewers find it here, then leave a real review on GitHub.
        </p>
      </div>

      {!preview ? (
        <input
          id="pr-review-url"
          type="url"
          value={prUrl}
          onChange={(event) => setPrUrl(event.target.value)}
          placeholder="https://github.com/owner/repo/pull/123"
          disabled={pending}
          className="w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      ) : (
        <div className="space-y-1.5 border border-border bg-background p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {preview.language ? (
              <span className="inline-flex items-center gap-1.5 border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: languageDotColor(preview.language) }}
                  aria-hidden
                />
                {preview.language}
              </span>
            ) : null}
            <span
              className="border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
              title={`+${preview.additions} -${preview.deletions}`}
            >
              {prSizeLabel(preview.additions, preview.deletions)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {preview.repoFullName} #{preview.number}
            </span>
          </div>
          <p className="truncate text-sm font-medium text-foreground">{preview.title}</p>
          <p className="text-xs text-muted-foreground">by @{preview.authorLogin}</p>
        </div>
      )}

      {preview?.existingStatus ? (
        <p
          className="rounded-none border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
          role="alert"
        >
          Already in the queue (status: {REVIEW_STATUS_LABEL[preview.existingStatus]}). No need
          to submit it again.
        </p>
      ) : null}

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
            {!preview.existingStatus ? (
              <Button type="button" size="sm" loading={pending} onClick={confirmSubmit}>
                Confirm & add to queue
              </Button>
            ) : null}
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={prUrl.trim().length === 0}
            onClick={loadPreview}
          >
            Preview
          </Button>
        )}
      </div>
    </div>
  );
}
