import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProjectExampleRepo, ProjectResource } from "@/types/project";

type ProjectSectionProps = {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ProjectSection({
  id,
  title,
  children,
  className,
}: ProjectSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 space-y-4 rounded-none border border-border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function ProjectBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
        >
          <span
            aria-hidden
            className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProjectResourceList({ resources }: { resources: ProjectResource[] }) {
  return (
    <ul className="space-y-2">
      {resources.map((resource) => (
        <li key={resource.title}>
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-foreground underline-offset-4 hover:underline"
            >
              {resource.title}
              <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">{resource.title}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ProjectExampleRepoList({ repos }: { repos: ProjectExampleRepo[] }) {
  return (
    <ul className="space-y-3">
      {repos.map((repo) => (
        <li
          key={repo.url}
          className="rounded-none border border-border bg-transparent p-3.5"
        >
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {repo.title}
            <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
          </a>
          {repo.description ? (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {repo.description}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ProjectDetailsToc({
  sections,
}: {
  sections: Array<{ id: string; title: string }>;
}) {
  return (
    <nav
      aria-label="On this page"
      className="rounded-none border border-border bg-card p-4"
    >
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ol className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <Link
              href={`#${section.id}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {section.title}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
