import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/design-system";
import { ReputationPanel } from "@/components/reputation/reputation-panel";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { loadOpenSourceReputation } from "@/lib/reputation";

export const metadata = {
  title: "Open Source Reputation",
  description:
    "Your open source impact score - merges, reviews, cadence, diversity, docs, issues, and code reviews.",
};

export default async function ReputationPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/reputation");
  }

  const reputation = await loadOpenSourceReputation(profile.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="prove // reputation"
        title="Open source reputation"
        description="A living measure of meaningful OSS impact - not vanity metrics. Reputation updates as you merge, review, and stay active."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/portfolio">ls ./portfolio</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/github">./sync --github</Link>
            </Button>
          </>
        }
      />

      <div className="mt-10">
        <ReputationPanel reputation={reputation} />
      </div>
    </div>
  );
}
