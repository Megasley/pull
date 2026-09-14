"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { reportOwnReviewAction } from "@/app/actions/pr-reviews";
import { Button } from "@/components/ui/button";

/**
 * Manual fallback next to each queue card — see reportOwnReview in
 * lib/pr-reviews/repository.ts for why the passive, sync-driven credit
 * detection can miss a real review. Re-checks GitHub directly server-side,
 * so this can't be gamed by clicking it without actually reviewing.
 */
export function ReportReviewedButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function report() {
    setError(null);
    startTransition(async () => {
      const result = await reportOwnReviewAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" size="sm" loading={pending} onClick={report}>
        I reviewed this
      </Button>
      {error ? (
        <span className="max-w-56 text-right text-[11px] text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
