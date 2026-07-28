import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { AchievementCard } from "@/components/achievements/achievement-card";
import {
  ContributionStatsGrid,
  FeaturedProjectsSection,
  FeaturedRepositoriesSection,
  MergedPrHighlightsSection,
  PortfolioSection,
  PublicTimelineSection,
  SkillsTechnologiesSection,
  SocialChip,
  WebsiteChip,
} from "@/components/profile/portfolio-sections";
import { ProfileEmptyState } from "@/components/profile/profile-empty-state";
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import { SiteContainer } from "@/components/layout/site-container";
import { BuilderScorePanel } from "@/components/score/builder-score-panel";
import { ReputationPanel } from "@/components/reputation/reputation-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  buildPublicReputationSummary,
  withPublicReputationCopy,
} from "@/lib/reputation";
import {
  buildPublicBuilderScoreSummary,
  withPublicBuilderScoreCopy,
} from "@/lib/score";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { PublicBuilderProfileData } from "@/types/profile";

type PublicBuilderProfileProps = {
  data: PublicBuilderProfileData;
};

export function PublicBuilderProfile({ data }: PublicBuilderProfileProps) {
  const {
    profile,
    level,
    builderScore,
    reputation,
    stats,
    skills,
    technologies,
    featuredRepositories,
    featuredProjects,
    mergedPrHighlights,
    timeline,
    roadmaps,
    achievements,
    isOwner,
  } = data;

  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileUrl = `${siteConfig.url}/u/${profile.username}`;
  const githubUrl = `https://github.com/${profile.githubUsername}`;
  const publicBuilderScore = withPublicBuilderScoreCopy(builderScore);
  const publicReputation = withPublicReputationCopy(reputation);
  const publicBuilderSummary = buildPublicBuilderScoreSummary(publicBuilderScore);
  const publicReputationSummary = buildPublicReputationSummary(publicReputation);

  return (
    <div className="profile-page">
      <SiteContainer className="pb-20">
        <header className="profile-header">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className="profile-avatar rounded-full">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
              ) : null}
              <AvatarFallback className="rounded-full bg-signal/30 font-mono text-lg text-ink">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="profile-eyebrow">
                Builder // @{profile.username}
              </p>
              <h1 className="profile-name">{profile.displayName}</h1>
              <p className="profile-handle">@{profile.username}</p>
              <p className="profile-tagline mt-2">
                {profile.bio.trim() ||
                  "Open source builder on Pull - learning, shipping, and contributing."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="profile-badge profile-badge-accent">
                  Builder score {builderScore.score}
                </span>
                <span className="profile-badge profile-badge-accent">
                  OSS reputation {reputation.score}
                </span>
                <span className="profile-badge profile-badge-level">
                  Level {level.level}
                </span>
                <span className="profile-badge">{level.xp} XP</span>
                {stats.mergedPullRequests > 0 ? (
                  <span className="profile-badge">
                    {stats.mergedPullRequests} merged PRs
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <SocialChip
                  href={githubUrl}
                  label={`@${profile.githubUsername}`}
                  icon={<ExternalLink className="size-3.5" />}
                  profile
                />
                {profile.website ? (
                  <WebsiteChip href={profile.website} profile />
                ) : null}
                {profile.twitterUrl ? (
                  <SocialChip
                    href={profile.twitterUrl}
                    label="X / Twitter"
                    icon={<ExternalLink className="size-3.5" />}
                    profile
                  />
                ) : null}
                {profile.linkedinUrl ? (
                  <SocialChip
                    href={profile.linkedinUrl}
                    label="LinkedIn"
                    icon={<ExternalLink className="size-3.5" />}
                    profile
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isOwner ? (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/settings/profile">Edit portfolio</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/u/${profile.username}/portfolio`}>PR portfolio</Link>
            </Button>
            <ShareProfileButton
              url={profileUrl}
              label="Copy share link"
              className="w-full sm:w-auto"
            />
            <Button asChild className="w-full sm:w-auto">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
          </div>
        </header>

        <ContributionStatsGrid stats={stats} profile />

        <div className="profile-section">
          <div className="grid gap-5 lg:grid-cols-2">
            <BuilderScorePanel
              score={publicBuilderScore}
              compact
              variant="profile"
              summaryText={publicBuilderSummary}
            />
            <ReputationPanel
              reputation={publicReputation}
              compact
              variant="profile"
              summaryText={publicReputationSummary}
            />
          </div>
        </div>

        <SkillsTechnologiesSection
          skills={skills}
          technologies={technologies}
          profile
        />

        <FeaturedRepositoriesSection
          repositories={featuredRepositories}
          profile
        />

        <MergedPrHighlightsSection
          items={mergedPrHighlights}
          username={profile.username}
          profile
        />

        <PublicTimelineSection events={timeline} profile />

        <PortfolioSection title="Roadmaps" profile>
          {roadmaps.length === 0 ? (
            <ProfileEmptyState
              title="No roadmap progress yet"
              description="Complete lessons on a roadmap to show progress here."
              ctaLabel="Browse roadmaps →"
              ctaHref="/roadmaps"
            />
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {roadmaps.map((roadmap) => (
                <li key={roadmap.roadmapSlug} className="profile-rm-card">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[15px] font-bold">{roadmap.title}</p>
                    <span
                      className={cn(
                        roadmap.percentage > 0
                          ? "profile-rm-pct-active"
                          : "profile-rm-pct-zero",
                      )}
                    >
                      {roadmap.percentage}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {roadmap.completed}/{roadmap.total} lessons
                  </p>
                  <div className="profile-rm-bar mt-2.5">
                    <div
                      className="profile-rm-bar-fill"
                      style={{ width: `${roadmap.percentage}%` }}
                    />
                  </div>
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/roadmaps/${roadmap.roadmapSlug}`}>
                        View roadmap
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PortfolioSection>

        <PortfolioSection title="Achievements" profile>
          {achievements.length === 0 ? (
            <ProfileEmptyState
              title="No achievements unlocked yet"
              description="Complete lessons, projects, and roadmaps to earn achievements."
              ctaLabel="Open dashboard →"
              ctaHref="/dashboard"
            />
          ) : (
            <ul className="grid gap-3.5 sm:grid-cols-2">
              {achievements.map((achievement, index) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  index={index}
                  variant="profile"
                />
              ))}
            </ul>
          )}
        </PortfolioSection>

        <FeaturedProjectsSection projects={featuredProjects} profile />
      </SiteContainer>
    </div>
  );
}
