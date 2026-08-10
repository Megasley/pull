import Link from "next/link";
import { ArrowLeft, ExternalLink, GitBranch } from "lucide-react";

import {
  DeveloperToolDifficultyBadge,
  DeveloperToolOpenSourceBadge,
  DeveloperToolSponsoredBadge,
} from "@/components/developer-tools/developer-tool-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeveloperTool } from "@/lib/developer-tools/types";

type DeveloperToolDetailProps = {
  tool: DeveloperTool;
};

export function DeveloperToolDetail({ tool }: DeveloperToolDetailProps) {
  return (
    <div className="space-y-12">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
          <Link href="/developer-tools">
            <ArrowLeft className="size-3.5" aria-hidden />
            All tools
          </Link>
        </Button>

        <header className="flex flex-col gap-6 border-b border-border pb-10 sm:flex-row sm:items-start">
          <div
            className="flex size-20 shrink-0 items-center justify-center border-2 border-ink bg-signal font-mono text-xl font-bold text-ink sm:size-24 sm:text-2xl"
            aria-hidden
          >
            {tool.logo}
          </div>
          <div className="min-w-0 flex-1">
            <p className="tech-eyebrow">developer-tools // {tool.category}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-bold tracking-[-0.04em]">
                {tool.name}
              </h1>
              {tool.sponsored ? <DeveloperToolSponsoredBadge /> : null}
            </div>
            <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
              {tool.description}
            </p>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              <span className="text-foreground/70">Build:</span>{" "}
              {tool.buildUseCase}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{tool.category}</Badge>
              <DeveloperToolOpenSourceBadge openSource={tool.openSource} />
              <DeveloperToolDifficultyBadge difficulty={tool.difficulty} />
              {tool.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <a href={tool.docs} target="_blank" rel="noreferrer">
                  Documentation
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={tool.website} target="_blank" rel="noreferrer">
                  Website
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
              {tool.github ? (
                <Button asChild variant="outline">
                  <a href={tool.github} target="_blank" rel="noreferrer">
                    <GitBranch className="size-3.5" aria-hidden />
                    GitHub
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </header>
      </div>

      <section aria-labelledby="overview-heading" className="space-y-4">
        <p className="tech-eyebrow">overview</p>
        <h2
          id="overview-heading"
          className="text-2xl font-bold tracking-[-0.03em]"
        >
          Overview
        </h2>
        <p className="max-w-3xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
          {tool.overview}
        </p>
      </section>

      <section aria-labelledby="why-heading" className="space-y-4">
        <p className="tech-eyebrow">why // builders</p>
        <h2 id="why-heading" className="text-2xl font-bold tracking-[-0.03em]">
          Why developers use this tool
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {tool.whyUse.map((reason) => (
            <li
              key={reason}
              className="flex gap-2 border border-border bg-background p-4 font-mono text-sm leading-relaxed text-muted-foreground"
            >
              <span className="mt-1.5 size-1.5 shrink-0 bg-signal" aria-hidden />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="build-heading" className="space-y-6">
        <div>
          <p className="tech-eyebrow">build // with this tool</p>
          <h2
            id="build-heading"
            className="mt-2 text-2xl font-bold tracking-[-0.03em]"
          >
            Build with this tool
          </h2>
          <p className="mt-2 max-w-2xl font-mono text-sm text-muted-foreground">
            Move from discovery into Pull’s Learn → Build → Contribute → Prove
            loop.
          </p>
        </div>

        {tool.learningPaths.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Related learning paths
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tool.learningPaths.map((path) => (
                <li key={path.href}>
                  <Button asChild variant="outline" size="sm">
                    <Link href={path.href}>{path.title}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {tool.projectIdeas.length > 0 ? (
        <section aria-labelledby="projects-heading" className="space-y-4">
          <p className="tech-eyebrow">projects // suggested</p>
          <h2
            id="projects-heading"
            className="text-2xl font-bold tracking-[-0.03em]"
          >
            Suggested projects
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tool.projectIdeas.map((idea) => (
              <li
                key={idea.title}
                className="border border-border bg-background p-4"
              >
                <h3 className="text-sm font-semibold tracking-tight">
                  {idea.title}
                </h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                  {idea.description}
                </p>
                {idea.href ? (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-3 -ml-2"
                  >
                    <Link href={idea.href}>Explore projects</Link>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="resources-heading" className="space-y-4">
        <p className="tech-eyebrow">resources</p>
        <h2
          id="resources-heading"
          className="text-2xl font-bold tracking-[-0.03em]"
        >
          Resources
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ResourceLink title="Documentation" href={tool.docs} />
          <ResourceLink title="Website" href={tool.website} />
          {tool.github ? (
            <ResourceLink title="GitHub" href={tool.github} />
          ) : null}
          {(tool.tutorials ?? []).map((tutorial) => (
            <ResourceLink
              key={tutorial.href}
              title={tutorial.title}
              href={tutorial.href}
              eyebrow="Tutorial"
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ResourceLink({
  title,
  href,
  eyebrow,
}: {
  title: string;
  href: string;
  eyebrow?: string;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex h-full flex-col border border-border bg-background p-4 transition-colors hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {eyebrow ? (
          <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </span>
        ) : null}
        <span className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold tracking-tight">
          {title}
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
        </span>
      </a>
    </li>
  );
}
