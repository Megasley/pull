import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { AchievementCard } from "@/components/achievements/achievement-card";
import { Muted } from "@/components/design-system";
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
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import { BuilderScorePanel } from "@/components/score/builder-score-panel";
import { ReputationPanel } from "@/components/reputation/reputation-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
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

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className="size-20 rounded-none border border-border sm:size-24">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
              ) : null}
              <AvatarFallback className="rounded-none font-mono text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="tech-eyebrow">builder // @{profile.username}</p>
              <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-bold tracking-[-0.04em]">
                {profile.displayName}
              </h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                @{profile.username}
              </p>
              <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
                {profile.bio.trim() ||
                  "Open source builder on Pull - learning, shipping, and contributing."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Builder Score {builderScore.score}
                </Badge>
                <Badge variant="secondary">
                  OSS Reputation {reputation.score}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px]">
                  Level {level.level}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {level.xp} XP
                </Badge>
                {stats.mergedPullRequests > 0 ? (
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {stats.mergedPullRequests} merged PRs
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            {isOwner ? (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/settings/profile">Edit portfolio</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/u/${profile.username}/portfolio`}>PR portfolio</Link>
            </Button>
            <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
              <ShareProfileButton url={profileUrl} />
            </div>
            <Button asChild className="w-full sm:w-auto">
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                GitHub
                <ExternalLink aria-hidden />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <SocialChip
            href={githubUrl}
            label={`@${profile.githubUsername}`}
            icon={<ExternalLink className="size-3.5" />}
          />
          {profile.website ? <WebsiteChip href={profile.website} /> : null}
          {profile.twitterUrl ? (
            <SocialChip
              href={profile.twitterUrl}
              label="X / Twitter"
              icon={<ExternalLink className="size-3.5" />}
            />
          ) : null}
          {profile.linkedinUrl ? (
            <SocialChip
              href={profile.linkedinUrl}
              label="LinkedIn"
              icon={<ExternalLink className="size-3.5" />}
            />
          ) : null}
        </div>

        <div className="mt-10 space-y-12">
          <ContributionStatsGrid stats={stats} />

          <div className="grid gap-10 lg:grid-cols-2">
            <BuilderScorePanel score={builderScore} />
            <ReputationPanel reputation={reputation} compact />
          </div>

          <SkillsTechnologiesSection
            skills={skills}
            technologies={technologies}
          />

          <FeaturedRepositoriesSection repositories={featuredRepositories} />

          <FeaturedProjectsSection projects={featuredProjects} />

          <MergedPrHighlightsSection
            items={mergedPrHighlights}
            username={profile.username}
          />

          <PublicTimelineSection events={timeline} />

          <PortfolioSection title="Roadmaps">
            {roadmaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No roadmap progress yet.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {roadmaps.map((roadmap) => (
                  <li
                    key={roadmap.roadmapSlug}
                    className="rounded-none border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{roadmap.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {roadmap.completed}/{roadmap.total} lessons
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {roadmap.percentage}%
                      </Badge>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-none bg-muted/60">
                      <div
                        className="h-full rounded-none bg-foreground"
                        style={{ width: `${roadmap.percentage}%` }}
                      />
                    </div>
                    <Button asChild variant="ghost" size="sm" className="mt-3 -ml-2">
                      <Link href={`/roadmaps/${roadmap.roadmapSlug}`}>
                        View roadmap
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </PortfolioSection>

          <PortfolioSection title="Achievements">
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No achievements unlocked yet.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {achievements.map((achievement, index) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    index={index}
                  />
                ))}
              </ul>
            )}
          </PortfolioSection>
        </div>
      </div>
    </div>
  );
}
