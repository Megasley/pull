"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { withdrawReviewRequestAction } from "@/app/actions/pr-reviews";
import { Button } from "@/components/ui/button";

export function WithdrawSubmissionButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function withdraw() {
    setError(null);
    startTransition(async () => {
      const result = await withdrawReviewRequestAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Withdraw
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </Button>
      <Button type="button" variant="destructive" size="sm" loading={pending} onClick={withdraw}>
        Confirm withdraw
      </Button>
    </div>
  );
}
