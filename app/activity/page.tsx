import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { ContributionTimeline } from "@/components/timeline/contribution-timeline";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { loadContributionTimeline } from "@/lib/timeline";

export const metadata = {
  title: "Activity",
  description:
    "Your Pull contribution timeline - commits, pull requests, issues, reviews, submissions, and roadmap completions.",
};

export default async function ActivityPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/activity");
  }

  const timeline = await loadContributionTimeline(profile.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="prove // activity"
        title="Activity timeline"
        description="A chronological view of what you build - GitHub work, project submissions, reviews, and finished roadmaps."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/repositories">ls ./repos</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/github">./sync --github</Link>
            </Button>
          </>
        }
      />

      <div className="mt-10">
        <ContributionTimeline data={timeline} />
      </div>
    </div>
  );
}
