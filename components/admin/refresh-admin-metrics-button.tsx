"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

/**
 * Hits a dedicated route (not a Server Action) so this can run far longer
 * than the /admin page's own maxDuration=30 allows — a Server Action is
 * bound to its page's maxDuration with no per-action override in Next.js,
 * and computing the full metrics snapshot can exceed that, which used to
 * surface as a raw "Connection closed" error when Vercel killed the
 * function mid-request. See app/api/admin/refresh-metrics/route.ts.
 */
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
            try {
              const response = await fetch("/api/admin/refresh-metrics", {
                method: "POST",
              });
              const result = await response.json();
              if (!result.ok) {
                setError(result.error ?? "Refresh failed");
                return;
              }
              router.refresh();
            } catch {
              setError("Refresh failed — check your connection and try again.");
            }
          });
        }}
      >
        {pending ? "Refreshing…" : "Refresh metrics"}
      </Button>
      {error ? <p className="font-mono text-[10px] text-destructive">{error}</p> : null}
    </div>
  );
}
