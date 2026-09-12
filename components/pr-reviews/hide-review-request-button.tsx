"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { hideReviewRequestAction } from "@/app/actions/pr-reviews";
import { Button } from "@/components/ui/button";

export function HideReviewRequestButton({ id }: { id: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function hide() {
    setError(null);
    startTransition(async () => {
      const result = await hideReviewRequestAction(id, reason || "Removed by admin");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Hide
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (optional)"
        disabled={pending}
        className="rounded-none border border-border bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
      <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button type="button" variant="destructive" size="sm" loading={pending} onClick={hide}>
        Confirm hide
      </Button>
    </div>
  );
}
