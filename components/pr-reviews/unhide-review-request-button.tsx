"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { unhideReviewRequestAction } from "@/app/actions/pr-reviews";
import { Button } from "@/components/ui/button";

export function UnhideReviewRequestButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function unhide() {
    setError(null);
    startTransition(async () => {
      const result = await unhideReviewRequestAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" loading={pending} onClick={unhide}>
        Unhide
      </Button>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
