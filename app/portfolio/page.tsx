import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { PullRequestPortfolio } from "@/components/portfolio/pull-request-portfolio";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { loadPullRequestPortfolio } from "@/lib/portfolio";

export const metadata = {
  title: "Pull request portfolio",
  description:
    "Your public record of GitHub pull requests - merged contributions, languages, and review activity.",
};

export default async function PortfolioPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/portfolio");
  }

  const portfolio = await loadPullRequestPortfolio(profile.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="prove // pr-portfolio"
        title="Pull request portfolio"
        description="A searchable record of the PRs you've authored - with merged contributions highlighted, plus language, labels, files changed, and review comments."
        meta={
          portfolio.lastSyncedAt
            ? `last sync // ${new Date(portfolio.lastSyncedAt).toLocaleString()}`
            : "last sync // never"
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/u/${profile.username}/portfolio`}>./public-view</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/github">./sync --github</Link>
            </Button>
          </>
        }
      />

      <div className="mt-10">
        <PullRequestPortfolio
          items={portfolio.items}
          connected={portfolio.connected}
          stats={portfolio.stats}
        />
      </div>
    </div>
  );
}
