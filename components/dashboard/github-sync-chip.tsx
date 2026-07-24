import Link from "next/link";
import { GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GithubDashboardSnapshot } from "@/types/github";

type GithubSyncChipProps = {
  snapshot: GithubDashboardSnapshot;
  className?: string;
};

function formatSyncedAt(value: string | null) {
  if (!value) {
    return "Not synced";
  }

  return `Synced ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))}`;
}

export function GithubSyncChip({ snapshot, className }: GithubSyncChipProps) {
  const { connection } = snapshot;

  if (!connection.connected) {
    return (
      <Link
        href="/settings/github"
        className={cn(
          "inline-flex items-center gap-2 border border-ink/25 bg-signal/20 px-2.5 py-1.5 font-mono text-[11px] text-ink transition-colors hover:bg-signal/35",
          className,
        )}
      >
        <GitBranch className="size-3.5" aria-hidden />
        Connect GitHub
      </Link>
    );
  }

  const status =
    connection.syncStatus === "error"
      ? "Sync error"
      : connection.syncStatus === "syncing"
        ? "Syncing…"
        : formatSyncedAt(connection.lastSyncedAt);

  return (
    <Link
      href="/settings/github"
      className={cn(
        "inline-flex max-w-full items-center gap-2 border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
        connection.syncStatus === "error" && "border-destructive/40 text-destructive",
        className,
      )}
      title={connection.syncError ?? undefined}
    >
      <GitBranch className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">
        @{connection.login} · {status}
      </span>
    </Link>
  );
}
