import {
  BookOpenCheck,
  ExternalLink,
  FlaskConical,
  MessageSquareQuote,
  MonitorPlay,
  Search,
} from "lucide-react";

import { LessonResourcesPanel } from "@/components/content/lesson-resources-panel";
import {
  buildBitcoinSearchUrl,
  resolveLessonSearchQuery,
} from "@/lib/content/bitcoin-search";
import { cn } from "@/lib/utils";
import type { LessonLab, LessonResource } from "@/types/content";

type LessonStudyPlanProps = {
  requiredReading: LessonResource[];
  interactiveLabs?: LessonResource[];
  reflectionPrompts: string[];
  searchQueries?: string[];
  lessonTitle?: string;
  lab?: LessonLab | null;
  className?: string;
};

export function LessonStudyPlan({
  requiredReading,
  interactiveLabs = [],
  reflectionPrompts,
  searchQueries = [],
  lessonTitle,
  lab,
  className,
}: LessonStudyPlanProps) {
  const hasReading = requiredReading.length > 0;
  const hasInteractive = interactiveLabs.length > 0;
  const hasPrompts = reflectionPrompts.length > 0;
  const hasLab = Boolean(lab?.title);
  const primaryQuery = resolveLessonSearchQuery(searchQueries, lessonTitle);
  const searchUrl = primaryQuery ? buildBitcoinSearchUrl(primaryQuery) : null;

  if (!hasReading && !hasInteractive && !hasPrompts && !hasLab && !searchUrl) {
    return null;
  }

  return (
    <section className={cn("space-y-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="tech-eyebrow text-foreground">study // plan</p>
          <p className="mt-2 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
            Lessons are primers. Start with Step 1 (required reading) when present, then
            follow the numbered steps in the article. Depth comes from primary sources,
            labs, reflection, and evidence.
          </p>
        </div>

        {searchUrl ? (
          <a
            href={searchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 border border-border bg-card px-3 py-2 font-mono text-[11px] tracking-wide text-foreground uppercase transition-colors hover:bg-muted"
          >
            <Search className="size-3.5" aria-hidden />
            Research on Bitcoin Search
            <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
          </a>
        ) : null}
      </div>

      {searchQueries.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {searchQueries.map((query) => (
            <a
              key={query}
              href={buildBitcoinSearchUrl(query)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase transition-colors hover:border-foreground hover:text-foreground"
            >
              {query}
              <ExternalLink className="size-2.5" aria-hidden />
            </a>
          ))}
        </div>
      ) : null}

      {hasReading ? (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium tracking-wide text-foreground uppercase">
            <BookOpenCheck className="size-4 text-ink" aria-hidden />
            Step 1 // Required reading
          </h3>
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            Complete these before the numbered steps in the lesson body. Links are
            listed here once — not repeated below.
          </p>
          <LessonResourcesPanel resources={requiredReading} heading="" />
        </div>
      ) : null}

      {hasInteractive ? (
        <div className="space-y-3 border border-ink/20 bg-signal/10 p-6">
          <h3 className="flex items-center gap-2 text-sm font-medium tracking-wide text-foreground uppercase">
            <MonitorPlay className="size-4 text-ink" aria-hidden />
            Interactive lab // Decoding Bitcoin
          </h3>
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            Open these Bitcoin Dev Project modules and tools before (or alongside) the
            graded lab. Capture evidence from the interactive path — do not only skim
            Pull.
          </p>
          <ul className="mt-2 space-y-3">
            {interactiveLabs.map((item) => (
              <li key={`${item.title}-${item.url ?? ""}`}>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
                  >
                    {item.title}
                    <ExternalLink
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                  </a>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                )}
                {item.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasPrompts ? (
        <div className="rounded-none border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            <MessageSquareQuote className="size-4 text-ink" aria-hidden />
            Reflection prompts
          </h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-foreground/90">
            {reflectionPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {hasLab && lab ? (
        <div className="rounded-none border border-ink/20 bg-signal/10 p-6">
          <h3 className="flex items-center gap-2 text-sm font-medium tracking-wide text-foreground uppercase">
            <FlaskConical className="size-4 text-ink" aria-hidden />
            Lab // {lab.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {lab.description}
          </p>
          {lab.evidence.length > 0 ? (
            <div className="mt-4">
              <p className="tech-eyebrow text-foreground">evidence required</p>
              <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                {lab.evidence.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-ink" aria-hidden>
                      ·
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
