import Link from "next/link";

import { AchievementCard } from "@/components/achievements/achievement-card";
import { ExternalLinkIcon } from "@/components/icons/outline-icons";
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
import {
  ProfileActivityStrip,
  ProfileContributionMixSection,
} from "@/components/profile/profile-value-sections";
import { ProfileEmptyState } from "@/components/profile/profile-empty-state";
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import { SiteContainer } from "@/components/layout/site-container";
import { BuilderScorePanel } from "@/components/score/builder-score-panel";
import { ReputationPanel } from "@/components/reputation/reputation-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { countryFlagEmoji, getCountryInfo } from "@/lib/geo/countries";
import { openToCtaLabel, shouldShowOpenToCta } from "@/lib/profile/open-to";
import {
  buildPublicReputationSummary,
  REPUTATION_EXPLAINER,
  withPublicReputationCopy,
} from "@/lib/reputation";
import {
  BUILDER_SCORE_EXPLAINER,
  buildPublicBuilderScoreSummary,
  withPublicBuilderScoreCopy,
} from "@/lib/score";
import { STRENGTH_LABEL, strengthFromNormalized } from "@/lib/scoring/normalize";
import { siteConfig } from "@/lib/site-config";
import type { PublicBuilderProfileData } from "@/types/profile";

type PublicBuilderProfileProps = {
  data: PublicBuilderProfileData;
};

/** Header score badge: tier leading, number secondary — "Strong Builder
 *  Score · 60/100" reads as progress to an outsider in a way "Builder score
 *  15/100" next to "Level 8" does not. */
function ScoreBadge({
  label,
  score,
  explainer,
}: {
  label: string;
  score: number;
  explainer: string;
}) {
  const tier = strengthFromNormalized(score / 100);
  return (
    <span className="profile-badge profile-badge-accent" title={explainer}>
      {STRENGTH_LABEL[tier]}
      <span className="ml-1 font-normal opacity-70">
        {label} · {score}/100
      </span>
    </span>
  );
}

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
    achievements,
    strengthLine,
    activity,
    contributionMix,
    partnerOrigin,
    maintainerBadge,
    isOwner,
  } = data;

  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const countryFlag = countryFlagEmoji(profile.country);
  const countryName = getCountryInfo(profile.country)?.name ?? null;
  const profileUrl = `${siteConfig.url}/u/${profile.username}`;
  const githubUrl = `https://github.com/${profile.githubUsername}`;
  // Best available way to reach out, in order — email is private and never
  // shown here (see types/user.ts:PublicBuilderProfile).
  const contactHref = profile.website ?? profile.linkedinUrl ?? profile.twitterUrl ?? githubUrl;
  const openToCta = shouldShowOpenToCta(profile.openTo) ? profile.openTo : null;
  const publicBuilderScore = withPublicBuilderScoreCopy(builderScore);
  const publicReputation = withPublicReputationCopy(reputation);
  const publicBuilderSummary = buildPublicBuilderScoreSummary(publicBuilderScore);
  const publicReputationSummary = buildPublicReputationSummary(publicReputation);

  return (
    <div className="profile-page">
      <SiteContainer className="pb-20">
        <header className="profile-header">
          <div className="min-w-0 flex-1">
            <div className="profile-identity">
              <Avatar className="profile-avatar rounded-full">
                {profile.avatar ? (
                  <AvatarImage src={profile.avatar} alt={profile.displayName} />
                ) : null}
                <AvatarFallback className="rounded-full bg-signal/30 font-mono text-lg text-ink">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="profile-eyebrow">Builder // @{profile.username}</p>
                <h1 className="profile-name">
                  {profile.displayName}
                  {countryFlag ? (
                    <span
                      className="ml-2 align-middle"
                      role="img"
                      aria-label={countryName ?? "Country flag"}
                      title={countryName ?? undefined}
                    >
                      {countryFlag}
                    </span>
                  ) : null}
                </h1>
                <p className="profile-handle">@{profile.username}</p>
              </div>
            </div>

            <p className="profile-tagline mt-4">
              {profile.bio.trim() ||
                "Open source builder on Pull - learning, shipping, and contributing."}
            </p>

            {strengthLine ? (
              <p className="profile-strength-line">{strengthLine}</p>
            ) : null}

            <ProfileActivityStrip activity={activity} />

            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {maintainerBadge ? (
                <a
                  href={`https://github.com/${maintainerBadge.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-badge"
                >
                  Maintainer of {maintainerBadge.name}
                </a>
              ) : null}
              {partnerOrigin ? (
                <Link
                  href={`/ecosystem/partners/${partnerOrigin.slug}`}
                  className="profile-badge"
                >
                  via {partnerOrigin.name}
                </Link>
              ) : null}
              {partnerOrigin ? (
                <>
                  <ScoreBadge
                    label="OSS Reputation"
                    score={reputation.score}
                    explainer={REPUTATION_EXPLAINER}
                  />
                  {builderScore.score > 0 ? (
                    <ScoreBadge
                      label="Builder Score"
                      score={builderScore.score}
                      explainer={BUILDER_SCORE_EXPLAINER}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  {builderScore.score > 0 ? (
                    <ScoreBadge
                      label="Builder Score"
                      score={builderScore.score}
                      explainer={BUILDER_SCORE_EXPLAINER}
                    />
                  ) : null}
                  <ScoreBadge
                    label="OSS Reputation"
                    score={reputation.score}
                    explainer={REPUTATION_EXPLAINER}
                  />
                </>
              )}
              <span className="profile-badge profile-badge-level">
                Level {level.level} · {level.xp} XP
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <SocialChip
                href={githubUrl}
                label={`@${profile.githubUsername}`}
                icon={<ExternalLinkIcon className="size-3.5" />}
                profile
              />
              {profile.website ? <WebsiteChip href={profile.website} profile /> : null}
              {profile.twitterUrl ? (
                <SocialChip
                  href={profile.twitterUrl}
                  label="X / Twitter"
                  icon={<ExternalLinkIcon className="size-3.5" />}
                  profile
                />
              ) : null}
              {profile.linkedinUrl ? (
                <SocialChip
                  href={profile.linkedinUrl}
                  label="LinkedIn"
                  icon={<ExternalLinkIcon className="size-3.5" />}
                  profile
                />
              ) : null}
            </div>
          </div>

          <div className="profile-actions">
            {openToCta ? (
              <Button asChild className="profile-open-to-cta w-full sm:w-auto">
                <a href={contactHref} target="_blank" rel="noopener noreferrer">
                  {openToCtaLabel(openToCta)}
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              </Button>
            ) : null}
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
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                GitHub
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </Button>
          </div>
        </header>

        <ContributionStatsGrid stats={stats} profile />

        <ProfileContributionMixSection mix={contributionMix} />

        <div className="profile-section">
          <div className="grid gap-5 lg:grid-cols-2">
            {partnerOrigin ? (
              <>
                <ReputationPanel
                  reputation={publicReputation}
                  compact
                  variant="profile"
                  summaryText={publicReputationSummary}
                />
                <BuilderScorePanel
                  score={publicBuilderScore}
                  compact
                  variant="profile"
                  summaryText={publicBuilderSummary}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        <SkillsTechnologiesSection
          skills={skills}
          technologies={technologies}
          profile
        />

        <FeaturedRepositoriesSection repositories={featuredRepositories} profile />

        <MergedPrHighlightsSection
          items={mergedPrHighlights}
          username={profile.username}
          profile
        />

        <PublicTimelineSection events={timeline} profile />

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
