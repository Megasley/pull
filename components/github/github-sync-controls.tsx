"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import {
  connectGithubAction,
  refreshGithubSyncAction,
} from "@/app/actions/github";
import { reconnectGithubForSync } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { GithubSyncStatus } from "@/types/github";

type GithubSyncControlsProps = {
  connected: boolean;
  syncStatus: GithubSyncStatus | null;
};

export function GithubSyncControls({
  connected,
  syncStatus,
}: GithubSyncControlsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!connected ? (
          <>
            <Button
              type="button"
              loading={pending}
              onClick={() => {
                setError(null);
                setMessage(null);
                startTransition(async () => {
                  const result = await connectGithubAction();
                  if (!result.ok) {
                    if (result.reason === "unauthenticated") {
                      router.push("/sign-in?next=/settings/github");
                      return;
                    }
                    setError(result.error);
                    return;
                  }
                  setMessage(
                    result.summary
                      ? `Synced ${result.summary.repositories} repos, ${result.summary.pullRequests} PRs.`
                      : "GitHub connected.",
                  );
                  router.refresh();
                });
              }}
            >
              Connect from session
            </Button>
            <form action={reconnectGithubForSync}>
              <Button type="submit" variant="outline" loading={pending}>
                Reconnect GitHub
              </Button>
            </form>
          </>
        ) : (
          <>
            <Button
              type="button"
              loading={pending || syncStatus === "syncing"}
              onClick={() => {
                setError(null);
                setMessage(null);
                startTransition(async () => {
                  const result = await refreshGithubSyncAction();
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setMessage(
                    result.summary
                      ? `Synced ${result.summary.repositories} repos, ${result.summary.pullRequests} PRs, ${result.summary.issues} issues, ${result.summary.commits} commits.`
                      : "Sync complete.",
                  );
                  router.refresh();
                });
              }}
            >
              <RefreshCw aria-hidden />
              {pending || syncStatus === "syncing" ? "Syncing…" : "Refresh now"}
            </Button>
            <form action={reconnectGithubForSync}>
              <Button type="submit" variant="outline" loading={pending}>
                Reconnect
              </Button>
            </form>
          </>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
