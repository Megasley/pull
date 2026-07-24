import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";

import { ContributionGraph } from "@/components/github/contribution-graph";
import { GithubSyncControls } from "@/components/github/github-sync-controls";
import { Badge } from "@/components/ui/badge";
import type { GithubDashboardSnapshot } from "@/types/github";

type GithubIntegrationPanelProps = {
  snapshot: GithubDashboardSnapshot;
  showControls?: boolean;
};

function formatStatus(status: string) {
  switch (status) {
    case "syncing":
      return "Syncing";
    case "success":
      return "Up to date";
    case "error":
      return "Needs attention";
    default:
      return "Idle";
  }
}

export function GithubIntegrationPanel({
  snapshot,
  showControls = true,
}: GithubIntegrationPanelProps) {
  const { connection, pinnedRepos, contributionDays, totals } = snapshot;

  if (!connection.connected) {
    return (
      <div className="rounded-none border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">GitHub</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect GitHub to sync repositories, pull requests, issues, commits,
          stars, followers, pinned repos, and your contribution graph.
        </p>
        {showControls ? (
          <div className="mt-5">
            <GithubSyncControls connected={false} syncStatus={null} />
          </div>
        ) : (
          <p className="mt-4 text-sm">
            <Link href="/settings/github" className="underline underline-offset-4">
              Open GitHub settings
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-none border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">GitHub</h2>
            <Badge variant="secondary">{formatStatus(connection.syncStatus)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            @{connection.login}
            {connection.lastSyncedAt
              ? ` · Last synced ${new Date(connection.lastSyncedAt).toLocaleString()}`
              : " · Not synced yet"}
          </p>
          {connection.syncError ? (
            <p className="mt-2 text-sm text-destructive">{connection.syncError}</p>
          ) : null}
        </div>
        {showControls ? (
          <GithubSyncControls
            connected
            syncStatus={connection.syncStatus}
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/repositories"
              className="text-sm underline underline-offset-4"
            >
              Explore repositories
            </Link>
            <Link
              href="/activity"
              className="text-sm underline underline-offset-4"
            >
              Activity timeline
            </Link>
            <Link
              href="/settings/github"
              className="text-sm underline underline-offset-4"
            >
              Manage sync
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Repositories" value={totals.repositories} />
        <Stat label="Stars" value={connection.totalStars} />
        <Stat label="Followers" value={connection.followers} />
        <Stat label="Pull requests" value={totals.pullRequests} />
      </div>

      <ContributionGraph days={contributionDays} />

      {pinnedRepos.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Pinned & recent repositories</h3>
          <ul className="grid gap-2 md:grid-cols-2">
            {pinnedRepos.map((repo) => (
              <li key={repo.id}>
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-none border border-border bg-transparent p-3 transition-colors hover:bg-background/70"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{repo.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {repo.description || "No description"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {repo.language ? <span>{repo.language}</span> : null}
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3" aria-hidden />
                          {repo.stargazersCount}
                        </span>
                        {repo.isPinned ? (
                          <Badge variant="outline" className="text-[10px]">
                            Pinned
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-none border border-border bg-transparent px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
