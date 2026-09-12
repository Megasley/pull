import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { MySubmissions } from "@/components/pr-reviews/my-submissions";
import { PrReviewList } from "@/components/pr-reviews/pr-review-list";
import { SubmitPrForm } from "@/components/pr-reviews/submit-pr-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export const metadata = {
  title: "PR Reviews",
  description:
    "Real GitHub pull requests looking for a reviewer across Bitcoin, Lightning, Nostr, and the wider open source ecosystem — it needs more reviewers than contributors.",
};

export default async function PrReviewsPage() {
  const profile = await bootstrapCurrentUserProfile();

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="contribute // reviews"
        title="Review a pull request"
        description="Browse real, open PRs across Bitcoin, Lightning, Nostr, and other open source ecosystems that need a second pair of eyes. Click through and leave an actual review on GitHub with your own account — Pull just helps you find it and credits you once it's done."
      />

      <Tabs defaultValue="browse" className="mt-8">
        <TabsList variant="line">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          {profile ? <TabsTrigger value="mine">My submissions</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="browse" className="mt-6 space-y-8">
          {profile ? (
            <SubmitPrForm />
          ) : (
            <div className="flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Sign in to ask peers to review a PR you&apos;ve submitted.
              </p>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href="/sign-in?next=/pr-reviews">Sign in</Link>
              </Button>
            </div>
          )}
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <PrReviewList />
          </Suspense>
        </TabsContent>

        {profile ? (
          <TabsContent value="mine" className="mt-6">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <MySubmissions />
            </Suspense>
          </TabsContent>
        ) : null}
      </Tabs>
    </SiteContainer>
  );
}
