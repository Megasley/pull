"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { refreshAdminMetricsAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function RefreshAdminMetricsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await refreshAdminMetricsAction();
            if (!result.ok) {
              setError(
                "error" in result && result.error
                  ? result.error
                  : "Refresh failed",
              );
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Refreshing…" : "Refresh metrics"}
      </Button>
      {error ? (
        <p className="font-mono text-[10px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
