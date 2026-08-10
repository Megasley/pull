import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AchievementsSection } from "@/components/dashboard/achievements-section";
import { AssignedIssuesSection } from "@/components/dashboard/assigned-issues-section";
import { ContinueLearningSection } from "@/components/dashboard/continue-learning-section";
import { ContributionStreakSection } from "@/components/dashboard/contribution-streak-section";
import { ContributingReposSection } from "@/components/dashboard/contributing-repos-section";
import { DashboardAccountMenu } from "@/components/dashboard/dashboard-account-menu";
import { SiteContainer } from "@/components/layout/site-container";
import { DashboardSectionNav } from "@/components/dashboard/dashboard-section-nav";
import {
  DashboardSetupStrip,
  type DashboardSetupItem,
} from "@/components/dashboard/dashboard-setup-strip";
import { DashboardStatusBar } from "@/components/dashboard/dashboard-status-bar";
import { GithubSyncChip } from "@/components/dashboard/github-sync-chip";
import { OpenPullRequestsSection } from "@/components/dashboard/open-pull-requests-section";
import { OpenSourceOpportunitiesSection } from "@/components/dashboard/open-source-opportunities-section";
import { PortfolioCompletionSection } from "@/components/dashboard/portfolio-completion-section";
import { ProjectsBuiltSection } from "@/components/dashboard/projects-built-section";
import { ProjectsInProgressSection } from "@/components/dashboard/projects-in-progress-section";
import { RecentLessonsSection } from "@/components/dashboard/recent-lessons-section";
import { RecommendedLessonsSection } from "@/components/dashboard/recommended-lessons-section";
import { ReviewsReceivedSection } from "@/components/dashboard/reviews-received-section";
import { RoadmapProgressSection } from "@/components/dashboard/roadmap-progress-section";
import { SkillsUnlockedSection } from "@/components/dashboard/skills-unlocked-section";
import { WeeklyGoalsSection } from "@/components/dashboard/weekly-goals-section";
import { Button } from "@/components/ui/button";
import { getPrimaryContinueTarget } from "@/lib/dashboard/build-dashboard-data";
import type { DashboardData } from "@/types/dashboard";
import type { GithubDashboardSnapshot } from "@/types/github";

type DashboardViewProps = {
  data: DashboardData;
  github: GithubDashboardSnapshot;
  signOutAction: () => Promise<void>;
};

function buildSetupItems(
  data: DashboardData,
  github: GithubDashboardSnapshot,
): DashboardSetupItem[] {
  const items: DashboardSetupItem[] = [];

  if (!github.connection.connected) {
    items.push({
      id: "github",
      title: "Connect GitHub",
      description: "Sync PRs, issues, streak, and contribution activity.",
      href: "/settings/github",
      actionLabel: "Connect",
      icon: "github",
    });
  }

  if (!data.continueLearning && data.recentLessons.length === 0) {
    items.push({
      id: "learn",
      title: "Start a roadmap",
      description: "Complete your first lesson to unlock continue + recommendations.",
      href: "/roadmaps/bitcoin",
      actionLabel: "Start Bitcoin",
      icon: "hammer",
    });
  }

  if (data.projectsInProgress.length === 0 && data.projectsBuilt.length === 0) {
    items.push({
      id: "build",
      title: "Ship a project",
      description: "Unlock a build challenge or submit a project for review.",
      href: "/projects",
      actionLabel: "Browse projects",
      icon: "hammer",
    });
  }

  if (
    github.connection.connected &&
    data.openPullRequests.length === 0 &&
    data.contributingRepos.length === 0
  ) {
    items.push({
      id: "contribute",
      title: "Open a contribution",
      description: "Find an issue, open a PR, then sync to track it here.",
      href: "/issues",
      actionLabel: "Find issues",
      icon: "branch",
    });
  }

  return items.slice(0, 3);
}

export function DashboardView({ data, github, signOutAction }: DashboardViewProps) {
  const { profile } = data;
  const continueHref = getPrimaryContinueTarget(data);
  const setupItems = buildSetupItems(data, github);

  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasLearnLists =
    data.roadmapProgress.length > 0 ||
    data.recentLessons.length > 0 ||
    data.recommendedLessons.length > 0;

  const hasBuildContent =
    data.projectsInProgress.length > 0 ||
    data.projectsBuilt.length > 0 ||
    data.reviewsReceived.length > 0;

  const hasContributeContent =
    data.weeklyGoals.length > 0 ||
    data.contributingRepos.length > 0 ||
    data.openPullRequests.length > 0 ||
    data.assignedIssues.length > 0 ||
    data.openSourceOpportunities.length > 0;

  const hasSkills =
    profile.skills.length > 0 || data.achievements.some((item) => item.earned);

  return (
    <SiteContainer className="py-10 pt-12 sm:py-12">
      <header className="flex flex-col gap-6 border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="tech-eyebrow">workspace // dashboard</p>
            <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-bold tracking-[-0.04em]">
              Welcome back, {profile.displayName}
            </h1>
            <p className="mt-2 max-w-xl font-mono text-xs text-muted-foreground sm:text-sm">
              One place to continue learning, ship projects, and track OSS work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GithubSyncChip snapshot={github} />
            <Button asChild>
              <Link href={continueHref}>
                ./continue
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <DashboardAccountMenu
              displayName={profile.displayName}
              username={profile.username}
              avatar={profile.avatar}
              initials={initials}
              signOutAction={signOutAction}
            />
          </div>
        </div>

        <DashboardStatusBar
          level={data.builderLevel}
          streak={data.contributionStreak}
          builderScore={data.builderScore?.score}
          reputationScore={data.reputation?.score}
          githubUsername={profile.githubUsername}
        />
      </header>

      <DashboardSectionNav />

      <div className="mt-8 space-y-12">
        <DashboardSetupStrip items={setupItems} />

        <section id="learn" className="scroll-mt-28 space-y-8" aria-label="Learn">
          <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink uppercase">
            <span className="size-1.5 bg-signal" aria-hidden />
            Learn
          </h2>
          <ContinueLearningSection item={data.continueLearning} />
          {hasLearnLists ? (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,1fr)]">
              <div className="space-y-8">
                <RoadmapProgressSection summaries={data.roadmapProgress} />
                <div className="grid gap-8 lg:grid-cols-2">
                  <RecentLessonsSection lessons={data.recentLessons} />
                  <RecommendedLessonsSection lessons={data.recommendedLessons} />
                </div>
              </div>
              <ContributionStreakSection streak={data.contributionStreak} />
            </div>
          ) : null}
        </section>

        <section id="build" className="scroll-mt-28 space-y-8" aria-label="Build">
          <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink uppercase">
            <span className="size-1.5 bg-signal" aria-hidden />
            Build
          </h2>
          {hasBuildContent ? (
            <>
              <div className="grid gap-8 lg:grid-cols-2">
                <ProjectsInProgressSection projects={data.projectsInProgress} />
                <ProjectsBuiltSection projects={data.projectsBuilt} />
              </div>
              <ReviewsReceivedSection reviews={data.reviewsReceived} />
            </>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">
              No build activity yet — use Setup above or{" "}
              <Link href="/projects" className="underline underline-offset-4">
                browse projects
              </Link>
              .
            </p>
          )}
        </section>

        <section
          id="contribute"
          className="scroll-mt-28 space-y-8"
          aria-label="Contribute"
        >
          <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink uppercase">
            <span className="size-1.5 bg-signal" aria-hidden />
            Contribute
          </h2>
          {hasContributeContent ? (
            <>
              <WeeklyGoalsSection goals={data.weeklyGoals} />
              <div className="grid gap-8 lg:grid-cols-2">
                <ContributingReposSection repos={data.contributingRepos} />
                <OpenPullRequestsSection pullRequests={data.openPullRequests} />
              </div>
              <div className="grid gap-8 lg:grid-cols-2">
                <AssignedIssuesSection issues={data.assignedIssues} />
                <OpenSourceOpportunitiesSection
                  opportunities={data.openSourceOpportunities}
                />
              </div>
            </>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">
              No contribution activity yet —{" "}
              <Link href="/settings/github" className="underline underline-offset-4">
                sync GitHub
              </Link>{" "}
              or{" "}
              <Link href="/issues" className="underline underline-offset-4">
                find an issue
              </Link>
              .
            </p>
          )}
        </section>

        <section id="prove" className="scroll-mt-28 space-y-8" aria-label="Prove">
          <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink uppercase">
            <span className="size-1.5 bg-signal" aria-hidden />
            Prove
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <PortfolioCompletionSection completion={data.portfolioCompletion} />
            {hasSkills ? (
              <SkillsUnlockedSection
                skills={profile.skills}
                achievements={data.achievements}
              />
            ) : null}
          </div>
          <AchievementsSection achievements={data.achievements} />
        </section>
      </div>
    </SiteContainer>
  );
}
