import { redirect } from "next/navigation";
import Link from "next/link";
import { after } from "next/server";

import { GithubIntegrationPanel } from "@/components/github/github-integration-panel";
import { PageHeader } from "@/components/design-system";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import {
  getSessionGithubAccessToken,
  isGithubSyncStale,
  loadGithubDashboardSnapshot,
  runGithubSync,
} from "@/lib/github";

export const metadata = {
  title: "GitHub",
  description: "Connect and sync your GitHub activity with Pull.",
};

export default async function GithubSettingsPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/settings/github");
  }

  const snapshot = await loadGithubDashboardSnapshot(profile.id);

  if (
    snapshot.connection.connected &&
    snapshot.connection.syncStatus !== "syncing" &&
    isGithubSyncStale(snapshot.connection.lastSyncedAt)
  ) {
    // Resolve cookies/session token in the request — `after()` cannot call cookies().
    const accessToken = await getSessionGithubAccessToken();
    after(async () => {
      await runGithubSync(profile.id, { accessToken });
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="settings // github"
        title="GitHub integration"
        description="Pull syncs your repositories, pull requests, issues, commits, stars, followers, pinned repos, and contribution graph. Background sync runs about once a day; you can refresh anytime."
      />
      <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground">
        also see{" "}
        <Link
          href="/settings/profile"
          className="underline underline-offset-4 hover:text-foreground"
        >
          ./settings/profile
        </Link>
      </p>

      <div className="mt-10">
        <GithubIntegrationPanel snapshot={snapshot} />
      </div>
    </div>
  );
}
