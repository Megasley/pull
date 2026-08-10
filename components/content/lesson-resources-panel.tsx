import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LessonResource, LessonResourceKind } from "@/types/content";

type LessonResourcesPanelProps = {
  resources: LessonResource[];
  className?: string;
  /** Override the default "resources" eyebrow. Pass empty string to hide. */
  heading?: string;
};

const KIND_LABELS: Record<LessonResourceKind, string> = {
  book: "book",
  bip: "bip",
  bolt: "bolt",
  docs: "docs",
  article: "article",
  video: "video",
  tool: "tool",
  interactive: "interactive",
};

export function LessonResourcesPanel({
  resources,
  className,
  heading = "resources",
}: LessonResourcesPanelProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
      {heading ? <h2 className="tech-eyebrow text-foreground">{heading}</h2> : null}
      <ul className="space-y-3">
        {resources.map((resource) => (
          <li
            key={`${resource.title}-${resource.chapter ?? ""}-${resource.url ?? ""}`}
            className="rounded-none border border-border bg-card px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              {resource.kind ? (
                <span className="tech-eyebrow text-[0.65rem] text-muted-foreground">
                  {KIND_LABELS[resource.kind]}
                </span>
              ) : null}
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
                >
                  {resource.title}
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {resource.title}
                </span>
              )}
            </div>
            {resource.chapter ? (
              <p className="mt-1.5 text-sm text-foreground/90">{resource.chapter}</p>
            ) : null}
            {resource.note ? (
              <p className="mt-1 text-xs text-muted-foreground">{resource.note}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
