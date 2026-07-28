import Link from "next/link";
import { ExternalLink, Globe, Star } from "lucide-react";

import { ProfileEmptyState } from "@/components/profile/profile-empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GithubRepositoryRecord } from "@/types/github";
import type { PublicCompletedProject } from "@/types/profile";
import type { PullRequestPortfolioItem } from "@/types/portfolio";
import { CONTRIBUTION_TYPE_LABEL } from "@/lib/portfolio/filter";
import { groupTimelineEvents } from "@/lib/profile/group-timeline";
import type { GroupedTimelineEvent } from "@/lib/profile/group-timeline";
import { TimelineItem } from "@/components/timeline/timeline-item";
import type { TimelineEvent } from "@/types/timeline";
import type { PortfolioTechnology } from "@/types/profile";
import { cn } from "@/lib/utils";

export function PortfolioSection({
  title,
  description,
  action,
  children,
  profile = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  profile?: boolean;
}) {
  if (profile) {
    return (
      <section className="profile-section">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="profile-section-title">{title}</h2>
            {description ? (
              <p className="profile-section-sub">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SkillsTechnologiesSection({
  skills,
  technologies,
  profile = false,
}: {
  skills: string[];
  technologies: PortfolioTechnology[];
  profile?: boolean;
}) {
  if (skills.length === 0 && technologies.length === 0) {
    return (
      <PortfolioSection title="Skills & technologies" profile={profile}>
        {profile ? (
          <ProfileEmptyState
            title="No skills or technologies yet"
            description="Skills and languages will appear as this builder syncs GitHub and edits their profile."
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Skills and languages will appear as this builder syncs GitHub and edits
            their profile.
          </p>
        )}
      </PortfolioSection>
    );
  }

  return (
    <PortfolioSection
      title="Skills & technologies"
      description={
        profile
          ? undefined
          : "Declared skills plus languages inferred from repositories and pull requests."
      }
      profile={profile}
    >
      <div className="space-y-4">
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) =>
              profile ? (
                <span key={skill} className="profile-tech-tag">
                  {skill}
                </span>
              ) : (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ),
            )}
          </div>
        ) : null}
        {technologies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) =>
              profile ? (
                <span key={tech.name} className="profile-tech-tag">
                  {tech.name}
                  <b className="ml-1 text-ink">{tech.count}</b>
                </span>
              ) : (
                <Badge key={tech.name} variant="outline">
                  {tech.name}
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                    {tech.count}
                  </span>
                </Badge>
              ),
            )}
          </div>
        ) : null}
      </div>
    </PortfolioSection>
  );
}

export function FeaturedRepositoriesSection({
  repositories,
  profile = false,
}: {
  repositories: GithubRepositoryRecord[];
  profile?: boolean;
}) {
  return (
    <PortfolioSection
      title={profile ? "Featured repository" : "Featured repositories"}
      description={
        profile
          ? undefined
          : "Pinned repos when available, otherwise top starred projects."
      }
      profile={profile}
    >
      {repositories.length === 0 ? (
        profile ? (
          <ProfileEmptyState
            title="No public repositories synced"
            description="Connect GitHub sync to showcase pinned and starred repos here."
            ctaLabel="GitHub sync settings →"
            ctaHref="/settings/github"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No public repositories synced yet.
          </p>
        )
      ) : (
        <ul className={cn(profile ? "space-y-3" : "grid gap-3 md:grid-cols-2")}>
          {repositories.slice(0, profile ? 1 : repositories.length).map((repo) => (
            <li key={repo.id}>
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  profile
                    ? "profile-repo-card group block"
                    : "group flex h-full flex-col rounded-none border border-border bg-card p-4 transition-colors hover:border-border hover:bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        profile
                          ? "text-[17px] font-bold group-hover:underline"
                          : "truncate font-medium group-hover:underline",
                      )}
                    >
                      {repo.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[12px] text-muted-foreground">
                      {repo.fullName}
                    </p>
                  </div>
                  <ExternalLink
                    className="size-3.5 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100"
                    aria-hidden
                  />
                </div>
                {repo.description ? (
                  <p
                    className={cn(
                      profile
                        ? "mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground"
                        : "mt-2 line-clamp-2 text-sm text-muted-foreground",
                    )}
                  >
                    {repo.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {repo.language ? (
                    profile ? (
                      <span className="profile-tech-tag">{repo.language}</span>
                    ) : (
                      <Badge variant="outline">{repo.language}</Badge>
                    )
                  ) : null}
                  {repo.isPinned ? (
                    profile ? (
                      <span className="profile-tech-tag">★ Pinned</span>
                    ) : (
                      <Badge variant="secondary">Pinned</Badge>
                    )
                  ) : null}
                  {!profile ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3" aria-hidden />
                      {repo.stargazersCount}
                    </span>
                  ) : null}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </PortfolioSection>
  );
}

export function FeaturedProjectsSection({
  projects,
  profile = false,
}: {
  projects: PublicCompletedProject[];
  profile?: boolean;
}) {
  return (
    <PortfolioSection
      title="Featured projects"
      description={
        profile ? undefined : "Approved submissions and completed Pull projects."
      }
      profile={profile}
    >
      {projects.length === 0 ? (
        profile ? (
          <ProfileEmptyState
            title="No featured projects yet"
            description="Submit and get a project approved to feature it here."
            ctaLabel="Browse projects →"
            ctaHref="/projects"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No featured projects yet.
          </p>
        )
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project.projectSlug}
              className={cn(
                profile
                  ? "profile-repo-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  : "flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div>
                <p className="font-medium">{project.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {project.projectSlug}
                  {project.submissionStatus
                    ? ` · ${project.submissionStatus}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${project.projectSlug}`}>Project</Link>
                </Button>
                {project.repoUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Repo
                      <ExternalLink aria-hidden />
                    </a>
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortfolioSection>
  );
}

export function MergedPrHighlightsSection({
  items,
  username,
  profile = false,
}: {
  items: PullRequestPortfolioItem[];
  username: string;
  profile?: boolean;
}) {
  return (
    <PortfolioSection
      title="Merged PR highlights"
      description={profile ? undefined : "Highest-signal merged contributions."}
      profile={profile}
      action={
        profile ? undefined : (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/u/${username}/portfolio`}>Full PR portfolio</Link>
          </Button>
        )
      }
    >
      {items.length === 0 ? (
        profile ? (
          <ProfileEmptyState
            title="No merged pull requests yet"
            description="Sync GitHub to surface merged PR highlights on this profile."
            ctaLabel="PR portfolio →"
            ctaHref={`/u/${username}/portfolio`}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No merged pull requests synced yet.
          </p>
        )
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  profile
                    ? "profile-pr-card group"
                    : "group flex items-start justify-between gap-3 rounded-none border border-ink/25 bg-signal/15 px-4 py-3 transition-colors hover:border-ink/40",
                )}
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {profile ? (
                      <span className="profile-pr-pill-merged">Merged</span>
                    ) : (
                      <Badge className="bg-signal text-ink hover:bg-signal/90">
                        Merged
                      </Badge>
                    )}
                    {profile ? (
                      <span className="profile-tech-tag text-[10px]">
                        {CONTRIBUTION_TYPE_LABEL[item.contributionType]}
                      </span>
                    ) : (
                      <Badge variant="outline">
                        {CONTRIBUTION_TYPE_LABEL[item.contributionType]}
                      </Badge>
                    )}
                    {!profile && item.language ? (
                      <Badge variant="outline">{item.language}</Badge>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      profile
                        ? "text-[14.5px] font-bold group-hover:underline"
                        : "mt-2 truncate text-sm font-medium group-hover:underline",
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      profile
                        ? "mt-0.5 font-mono text-[11.5px] text-ink/75"
                        : "mt-0.5 font-mono text-[11px] text-muted-foreground",
                    )}
                  >
                    {item.repoFullName} · #{item.number}
                  </p>
                </div>
                <ExternalLink
                  className="size-3.5 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100"
                  aria-hidden
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </PortfolioSection>
  );
}

export function PublicTimelineSection({
  events,
  profile = false,
}: {
  events: TimelineEvent[];
  profile?: boolean;
}) {
  const displayEvents: GroupedTimelineEvent[] = profile
    ? groupTimelineEvents(events)
    : events;

  return (
    <PortfolioSection
      title="Contribution timeline"
      description={profile ? undefined : "Recent open source and Pull activity."}
      profile={profile}
    >
      {displayEvents.length === 0 ? (
        profile ? (
          <ProfileEmptyState
            title="No public activity yet"
            description="Lessons, submissions, and GitHub sync activity will appear here."
          />
        ) : (
          <p className="text-sm text-muted-foreground">No public activity yet.</p>
        )
      ) : (
        <ul className={profile ? undefined : "space-y-2"}>
          {displayEvents.map((event, index) => (
            <li key={event.id}>
              <TimelineItem
                event={event}
                index={index}
                profile={profile}
                groupCount={event.groupCount}
              />
            </li>
          ))}
        </ul>
      )}
    </PortfolioSection>
  );
}

export function ContributionStatsGrid({
  stats,
  profile = false,
}: {
  stats: {
    mergedPullRequests: number;
    repositories: number;
    languagesUsed: number;
    lessonsCompleted: number;
    achievementsUnlocked: number;
    uniqueContributionRepos?: number;
    roadmapsCompleted?: number;
    projectsCompleted?: number;
    projectsApproved?: number;
    roadmapsStarted?: number;
  };
  profile?: boolean;
}) {
  const items = profile
    ? [
        { label: "Merged PRs", value: stats.mergedPullRequests },
        { label: "Repositories", value: stats.repositories },
        { label: "Languages", value: stats.languagesUsed },
        { label: "Lessons done", value: stats.lessonsCompleted },
        { label: "Achievements", value: stats.achievementsUnlocked },
      ]
    : [
        { label: "Merged PRs", value: stats.mergedPullRequests },
        {
          label: "Contribution repos",
          value: stats.uniqueContributionRepos ?? 0,
        },
        { label: "Repositories", value: stats.repositories },
        { label: "Languages", value: stats.languagesUsed },
        { label: "Lessons completed", value: stats.lessonsCompleted },
        { label: "Roadmaps completed", value: stats.roadmapsCompleted ?? 0 },
        { label: "Projects completed", value: stats.projectsCompleted ?? 0 },
        { label: "Projects approved", value: stats.projectsApproved ?? 0 },
        { label: "Achievements", value: stats.achievementsUnlocked },
        { label: "Roadmaps started", value: stats.roadmapsStarted ?? 0 },
      ];

  return (
    <PortfolioSection
      title="Contribution statistics"
      description="Learning progress and open source output in one view."
      profile={profile}
    >
      <div className={profile ? "profile-stat-grid" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-5"}>
        {items.map((item) =>
          profile ? (
            <div key={item.label} className="profile-stat-cell">
              <p className="profile-stat-label">{item.label}</p>
              <p
                className={cn(
                  "profile-stat-num",
                  item.value === 0 && "profile-stat-num-zero",
                )}
              >
                {item.value}
              </p>
            </div>
          ) : (
            <div
              key={item.label}
              className="rounded-none border border-border bg-card p-4"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {item.value}
              </p>
            </div>
          ),
        )}
      </div>
    </PortfolioSection>
  );
}

export function SocialChip({
  href,
  label,
  icon,
  profile = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  profile?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        profile
          ? "inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          : "inline-flex items-center gap-1.5 rounded-none border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </a>
  );
}

export function WebsiteChip({
  href,
  profile = false,
}: {
  href: string;
  profile?: boolean;
}) {
  return (
    <SocialChip
      href={href}
      label="Website"
      icon={<Globe className="size-3.5" />}
      profile={profile}
    />
  );
}
