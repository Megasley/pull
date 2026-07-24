import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { RepositoryExplorer } from "@/components/github/repository-explorer";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import {
  getGithubConnectionPublic,
  listGithubRepositories,
} from "@/lib/github";

export const metadata = {
  title: "Repositories",
  description:
    "Explore your synced GitHub repositories with search, filters, and contribution status.",
};

export default async function RepositoriesPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/repositories");
  }

  const [connection, repositories] = await Promise.all([
    getGithubConnectionPublic(profile.id),
    listGithubRepositories(profile.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="github // repositories"
        title="Repository explorer"
        description="Browse every synced repository - language, stars, forks, license, topics, open issues, and contribution status - with search and filters."
        meta={connection ? `user // @${connection.login}` : "status // disconnected"}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/settings/github">./sync --settings</Link>
            </Button>
            {connection?.profileUrl ? (
              <Button asChild>
                <a href={connection.profileUrl} target="_blank" rel="noreferrer">
                  @{connection.login}
                </a>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-10">
        <RepositoryExplorer
          repositories={repositories}
          connected={Boolean(connection)}
        />
      </div>
    </div>
  );
}
