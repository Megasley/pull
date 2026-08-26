import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { DiscoveryRepoCard } from "@/components/discovery/discovery-repo-card";
import { OpportunityExploreTracker } from "@/components/partners/opportunity-explore-tracker";
import { SuggestedIssueCard } from "@/components/partners/suggested-issue-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getDb } from "@/lib/db";
import { githubConnections, users } from "@/lib/db/schema";
import {
  countGithubSyncedEntities,
  countMergedGithubPullRequests,
  countSubmittedGithubPullRequests,
} from "@/lib/github/store";
import { getUserOrgMembershipBySlug } from "@/lib/partners/memberships";
import {
  getRecommendedOpportunities,
  getSuggestedOpportunities,
} from "@/lib/partners/opportunities";
import { getPartnerOrgBySlug, listOrgSkills } from "@/lib/partners/orgs";

export const metadata = { title: "Partner Organization · Pull" };

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default async function PartnerOrgHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <p className="font-mono text-sm text-muted-foreground">Service unavailable.</p>
      </div>
    );
  }

  const profile = await bootstrapCurrentUserProfile();
  if (!profile) {
    redirect(`/sign-in?next=${encodeURIComponent(`/partners/${slug}`)}`);
  }

  const org = await getPartnerOrgBySlug(slug);
  if (!org) redirect("/dashboard");

  // Access control — must be a member
  const membership = await getUserOrgMembershipBySlug(profile.id, slug);
  if (!membership) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16 sm:px-6 lg:px-8">
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Pull // Access Denied
        </p>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          You don&apos;t have access to this organization.
        </h1>
        <p className="mt-4 font-mono text-sm text-muted-foreground">
          This page is only available to verified members of {org.name}.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get user's skills from profile + GitHub
  const db = getDb();
  const [userRow] = await db
    .select({ skills: users.skills })
    .from(users)
    .where(eq(users.id, profile.id))
    .limit(1);
  const [ghConn] = await db
    .select({ login: githubConnections.login })
    .from(githubConnections)
    .where(eq(githubConnections.userId, profile.id))
    .limit(1);

  const [{ pullRequests: prCount }, submittedPrCount, mergedPrCount] = await Promise.all([
    countGithubSyncedEntities(profile.id),
    countSubmittedGithubPullRequests(profile.id),
    countMergedGithubPullRequests(profile.id),
  ]);
  const hasOpenedPr = prCount > 0;
  const hasSubmittedPr = submittedPrCount > 0;
  const hasMergedPr = mergedPrCount > 0;
  const hasExploredOpportunity = Boolean(membership.exploredOpportunityAt) || hasOpenedPr;

  const userSkills = (userRow?.skills ?? []) as string[];
  const curatedOpportunities = await getRecommendedOpportunities(org.id, userSkills);

  // Fall back to real projects/issues matched on the org's admin-configured
  // skills (+ the participant's own detected skills) when nothing has been
  // hand-curated yet — a fresh org should never just show "empty."
  const orgSkills = await listOrgSkills(org.id);
  const suggestedOpportunities =
    curatedOpportunities.length === 0
      ? getSuggestedOpportunities([...new Set([...orgSkills, ...userSkills])])
      : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-24 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-border pb-10">
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          {org.name}
        </p>
        <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em] text-balance">
          Welcome, Builder.
        </h1>
        <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
          You&apos;re in. Now it&apos;s time to contribute.
        </p>

        <div className="mt-8 border border-border bg-background px-5 py-4">
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Organization</p>
          <p className="mt-1 font-mono text-sm font-semibold">{org.name}</p>
        </div>
      </div>

      {/* Journey tracker */}
      <div className="mt-12">
        <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Your Contribution Journey
        </h2>
        <div className="mt-4 border border-border divide-y divide-border">
          {(() => {
            // Explore: tracked when the member clicks into a suggested/curated
            // opportunity (or inferred if they already have a PR).
            // Start: any PR exists (draft or not). Submit: a non-draft
            // ("ready for review") PR exists. Merged: a PR was actually merged.
            const steps = [
              { done: true, label: "Joined Pull" },
              { done: Boolean(ghConn?.login), label: "Connected GitHub" },
              { done: hasExploredOpportunity, label: "Explore your first opportunity" },
              { done: hasOpenedPr, label: "Start a contribution" },
              { done: hasSubmittedPr, label: "Submit a pull request" },
              { done: hasMergedPr, label: "Get your first PR merged" },
            ];
            const currentIndex = steps.findIndex((step) => !step.done);

            return steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={`font-mono text-base ${
                    step.done
                      ? "text-green-600 dark:text-green-400"
                      : i === currentIndex
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {step.done ? "✓" : i === currentIndex ? "◉" : "○"}
                </span>
                <span
                  className={`font-mono text-sm ${
                    step.done || i === currentIndex ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Your next step */}
      <div className="mt-12">
        <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Your Next Step
        </h2>
        <div className="mt-4 border border-border px-6 py-6">
          <p className="text-lg font-bold">Find your first contribution.</p>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            These opportunities are curated for {org.name} builders.
          </p>
        </div>
      </div>

      {/* Opportunities */}
      <div className="mt-10">
        <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Recommended Opportunities //{" "}
          {curatedOpportunities.length || suggestedOpportunities.length}
        </h2>

        <OpportunityExploreTracker orgSlug={slug}>
        {curatedOpportunities.length > 0 ? (
          <div className="mt-4 flex flex-col gap-4">
            {curatedOpportunities.map((opp) => (
              <div key={opp.id} className="border border-border px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{opp.title}</h3>
                      {opp.isPinned && (
                        <Badge variant="default" className="text-[10px]">Pinned</Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {DIFFICULTY_LABELS[opp.difficulty] ?? opp.difficulty}
                      </Badge>
                      {opp.contributionType && (
                        <Badge variant="outline" className="text-[10px]">
                          {opp.contributionType}
                        </Badge>
                      )}
                    </div>
                    {opp.description && (
                      <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                        {opp.description}
                      </p>
                    )}
                    {(opp.skills as string[]).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(opp.skills as string[]).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-none border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {opp.whyRecommended && (
                      <p className="mt-3 font-mono text-xs text-muted-foreground border-l-2 border-border pl-3">
                        {opp.whyRecommended}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {opp.issueUrl && (
                    <a
                      href={opp.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-border px-4 py-2 font-mono text-xs transition-colors hover:bg-muted/40"
                    >
                      View Issue →
                    </a>
                  )}
                  {opp.repositoryUrl && (
                    <a
                      href={opp.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted/40"
                    >
                      Repository →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : suggestedOpportunities.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedOpportunities.map((suggestion, i) =>
              suggestion.kind === "repository" ? (
                <DiscoveryRepoCard
                  key={`repo-${suggestion.repository.id}`}
                  repository={suggestion.repository}
                  index={i}
                />
              ) : (
                <SuggestedIssueCard
                  key={`issue-${suggestion.issue.id}`}
                  issue={suggestion.issue}
                  index={i}
                />
              ),
            )}
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-border px-6 py-10 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              No opportunities curated yet. Check back soon.
            </p>
          </div>
        )}
        </OpportunityExploreTracker>

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/discover">See more open source projects →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
