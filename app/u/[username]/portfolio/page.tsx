import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { PullRequestPortfolio } from "@/components/portfolio/pull-request-portfolio";
import { Button } from "@/components/ui/button";
import { getUserByUsername } from "@/lib/profile/repository";
import { loadPullRequestPortfolio } from "@/lib/portfolio";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `@${username} · PR portfolio`,
    description: `Public pull request portfolio for @${username} on Pull.`,
  };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserByUsername(username);

  if (!profile) {
    notFound();
  }

  const portfolio = await loadPullRequestPortfolio(profile.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={`public // @${profile.username}`}
        title={`${profile.displayName}'s pull requests`}
        description="A public record of GitHub contributions synced to Pull - merged work highlighted."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/u/${profile.username}`}>./profile</Link>
            </Button>
            <Button asChild>
              <a
                href={`https://github.com/${profile.githubUsername}`}
                target="_blank"
                rel="noreferrer"
              >
                ./github
              </a>
            </Button>
          </>
        }
      />

      <div className="mt-10">
        <PullRequestPortfolio
          items={portfolio.items}
          connected={portfolio.connected}
          stats={portfolio.stats}
          publicView
        />
      </div>
    </div>
  );
}
