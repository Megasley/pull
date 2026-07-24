import Link from "next/link";
import { ExternalLink, Globe, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GithubRepositoryRecord } from "@/types/github";
import type { PublicCompletedProject } from "@/types/profile";
import type { PullRequestPortfolioItem } from "@/types/portfolio";
import { CONTRIBUTION_TYPE_LABEL } from "@/lib/portfolio/filter";
import { TimelineItem } from "@/components/timeline/timeline-item";
import type { TimelineEvent } from "@/types/timeline";
import type { PortfolioTechnology } from "@/types/profile";

export function PortfolioSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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
}: {
  skills: string[];
  technologies: PortfolioTechnology[];
}) {
  if (skills.length === 0 && technologies.length === 0) {
    return (
      <PortfolioSection title="Skills & technologies">
        <p className="text-sm text-muted-foreground">
          Skills and languages will appear as this builder syncs GitHub and edits
          their profile.
        </p>
      </PortfolioSection>
    );
  }

  return (
    <PortfolioSection
      title="Skills & technologies"
      description="Declared skills plus languages inferred from repositories and pull requests."
    >
      <div className="space-y-4">
        {skills.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {technologies.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Technologies
            </p>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech) => (
                <Badge key={tech.name} variant="outline">
                  {tech.name}
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                    {tech.count}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PortfolioSection>
  );
}

export function FeaturedRepositoriesSection({
  repositories,
}: {
  repositories: GithubRepositoryRecord[];
}) {
  return (
    <PortfolioSection
      title="Featured repositories"
      description="Pinned repos when available, otherwise top starred projects."
    >
      {repositories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No public repositories synced yet.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {repositories.map((repo) => (
            <li key={repo.id}>
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col rounded-none border border-border bg-card p-4 transition-colors hover:border-border hover:bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium group-hover:underline">
                      {repo.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {repo.fullName}
                    </p>
                  </div>
                  <ExternalLink
                    className="size-3.5 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100"
                    aria-hidden
                  />
                </div>
                {repo.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {repo.description}
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs text-muted-foreground">
                  {repo.language ? (
                    <Badge variant="outline">{repo.language}</Badge>
                  ) : null}
                  {repo.isPinned ? (
                    <Badge variant="secondary">Pinned</Badge>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3" aria-hidden />
                    {repo.stargazersCount}
                  </span>
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
}: {
  projects: PublicCompletedProject[];
}) {
  return (
    <PortfolioSection
      title="Featured projects"
      description="Approved submissions and completed Pull projects."
    >
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No featured projects yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project.projectSlug}
              className="flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
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
                  <Button asChild variant="ghost" size="sm">
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
}: {
  items: PullRequestPortfolioItem[];
  username: string;
}) {
  return (
    <PortfolioSection
      title="Merged PR highlights"
      description="Highest-signal merged contributions."
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href={`/u/${username}/portfolio`}>Full PR portfolio</Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No merged pull requests synced yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-3 rounded-none border border-ink/25 bg-signal/15 px-4 py-3 transition-colors hover:border-ink/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-signal text-ink hover:bg-signal/90">
                      Merged
                    </Badge>
                    <Badge variant="outline">
                      {CONTRIBUTION_TYPE_LABEL[item.contributionType]}
                    </Badge>
                    {item.language ? (
                      <Badge variant="outline">{item.language}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-sm font-medium group-hover:underline">
                    {item.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
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

export function PublicTimelineSection({ events }: { events: TimelineEvent[] }) {
  return (
    <PortfolioSection
      title="Contribution timeline"
      description="Recent open source and Pull activity."
    >
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No public activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event, index) => (
            <li key={event.id}>
              <TimelineItem event={event} index={index} />
            </li>
          ))}
        </ul>
      )}
    </PortfolioSection>
  );
}

export function ContributionStatsGrid({
  stats,
}: {
  stats: {
    mergedPullRequests: number;
    uniqueContributionRepos: number;
    repositories: number;
    languagesUsed: number;
    lessonsCompleted: number;
    roadmapsCompleted: number;
    projectsCompleted: number;
    projectsApproved: number;
    achievementsUnlocked: number;
    roadmapsStarted: number;
  };
}) {
  const items = [
    { label: "Merged PRs", value: stats.mergedPullRequests },
    { label: "Contribution repos", value: stats.uniqueContributionRepos },
    { label: "Repositories", value: stats.repositories },
    { label: "Languages", value: stats.languagesUsed },
    { label: "Lessons completed", value: stats.lessonsCompleted },
    { label: "Roadmaps completed", value: stats.roadmapsCompleted },
    { label: "Projects completed", value: stats.projectsCompleted },
    { label: "Projects approved", value: stats.projectsApproved },
    { label: "Achievements", value: stats.achievementsUnlocked },
    { label: "Roadmaps started", value: stats.roadmapsStarted },
  ];

  return (
    <PortfolioSection
      title="Contribution statistics"
      description="Learning progress and open source output in one view."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
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
        ))}
      </div>
    </PortfolioSection>
  );
}

export function SocialChip({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-none border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
    >
      {icon}
      {label}
    </a>
  );
}

export function WebsiteChip({ href }: { href: string }) {
  return <SocialChip href={href} label="Website" icon={<Globe className="size-3.5" />} />;
}
