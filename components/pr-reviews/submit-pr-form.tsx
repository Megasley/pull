"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitPrForReviewAction } from "@/app/actions/pr-reviews";
import { Button } from "@/components/ui/button";

export function SubmitPrForm() {
  const router = useRouter();
  const [prUrl, setPrUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setMessage(null);
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
      setMessage("Added to the review queue.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-none border border-border bg-card p-4">
      <div>
        <label htmlFor="pr-review-url" className="text-sm font-medium">
          Ask peers to review your PR
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste a GitHub pull request URL. You won&apos;t see your own PR in the queue below —
          reviewers find it here, then leave a real review on GitHub.
        </p>
      </div>
      <input
        id="pr-review-url"
        type="url"
        value={prUrl}
        onChange={(event) => setPrUrl(event.target.value)}
        placeholder="https://github.com/owner/repo/pull/123"
        disabled={pending}
        className="w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
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
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          loading={pending}
          disabled={prUrl.trim().length === 0}
          onClick={submit}
        >
          Add to queue
        </Button>
      </div>
    </div>
  );
}
