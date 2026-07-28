"use client";

import Link from "next/link";
import { useState } from "react";

import { LessonBuildChallenge } from "@/components/content/lesson-build-challenge";
import { LessonCompletionButton } from "@/components/content/lesson-completion-button";
import { LessonKeyboardHelp } from "@/components/content/lesson-keyboard-help";
import { LessonNavigationBar } from "@/components/content/lesson-navigation";
import { LessonObjectives } from "@/components/content/lesson-objectives";
import { LessonReadingProgress } from "@/components/content/lesson-reading-progress";
import { LessonResourcesPanel } from "@/components/content/lesson-resources-panel";
import { LessonStudyHabits } from "@/components/content/lesson-study-habits";
import { LessonStudyPlan } from "@/components/content/lesson-study-plan";
import { StickyTableOfContents } from "@/components/content/sticky-table-of-contents";
import { SiteContainer } from "@/components/layout/site-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useLessonCompletion } from "@/hooks/use-lesson-completion";
import { useLessonShortcuts } from "@/hooks/use-lesson-shortcuts";
import { useActiveHeading, useReadingProgress } from "@/hooks/use-lesson-reading";
import {
  buildBitcoinSearchUrl,
  resolveLessonSearchQuery,
} from "@/lib/content/bitcoin-search";
import { cn } from "@/lib/utils";
import type { CompiledLesson, LessonNavigation } from "@/types/content";
import {
  normalizeResources,
  normalizeStringList,
  resolveInteractiveLabs,
  resolveRequiredReading,
  resolveSearchQueries,
} from "@/types/content";
import type { RoadmapJson } from "@/types/roadmap";

type LessonExperienceProps = {
  lesson: CompiledLesson;
  navigation: LessonNavigation;
  roadmap: RoadmapJson;
  children: React.ReactNode;
};

export function LessonExperience({
  lesson,
  navigation,
  roadmap,
  children,
}: LessonExperienceProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const readingProgress = useReadingProgress();
  const headingIds = lesson.toc.map((item) => item.id);
  const { activeId, scrollToHeading } = useActiveHeading(
    "lesson-content",
    headingIds,
  );
  const { isAuthenticated } = useAuthSession();
  const { isComplete, toggleComplete, roadmapProgress } = useLessonCompletion(
    lesson.roadmap,
    lesson.slug,
    roadmap,
  );
  const signInHref = `/sign-in?next=${encodeURIComponent(
    `/roadmaps/${lesson.roadmap}/lessons/${lesson.slug}`,
  )}`;

  const resources = normalizeResources(lesson.resources);
  const requiredReading = resolveRequiredReading(lesson);
  const interactiveLabs = resolveInteractiveLabs(lesson);
  const reflectionPrompts = normalizeStringList(lesson.reflectionPrompts);
  const searchQueries = resolveSearchQueries(lesson);
  const primarySearchQuery = resolveLessonSearchQuery(
    searchQueries,
    lesson.title,
  );
  const researchUrl = primarySearchQuery
    ? buildBitcoinSearchUrl(primarySearchQuery)
    : null;
  const requiredTitles = new Set(
    requiredReading.map((item) => `${item.title}::${item.chapter ?? ""}`),
  );
  const interactiveTitles = new Set(
    interactiveLabs.map((item) => `${item.title}::${item.chapter ?? ""}`),
  );
  const furtherReading = resources.filter((item) => {
    const key = `${item.title}::${item.chapter ?? ""}`;
    return (
      !requiredTitles.has(key) &&
      !interactiveTitles.has(key) &&
      item.kind !== "interactive"
    );
  });
  const objectives = lesson.objectives ?? [];

  useLessonShortcuts({
    roadmapSlug: lesson.roadmap,
    previousSlug: navigation.previous?.slug,
    nextSlug: navigation.next?.slug,
    researchUrl,
    canToggleComplete: isAuthenticated,
    onToggleComplete: toggleComplete,
    onToggleHelp: () => setHelpOpen((current) => !current),
  });

  return (
    <>
      <LessonReadingProgress progress={readingProgress} />
      <LessonKeyboardHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        researchUrl={researchUrl}
        researchQuery={primarySearchQuery}
        canToggleComplete={isAuthenticated}
      />

      <SiteContainer className="py-10">
        <header className="mb-10 max-w-3xl border-b border-border pb-8">
          <p className="tech-eyebrow">
            <Link
              href={`/roadmaps/${lesson.roadmap}`}
              className="transition-colors hover:text-foreground"
            >
              lesson // {lesson.roadmap}
            </Link>
          </p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em]">
            {lesson.title}
          </h1>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            {lesson.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{lesson.difficulty}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              {lesson.duration}
            </span>
            {lesson.project ? (
              <Badge variant="outline">project // {lesson.project}</Badge>
            ) : null}
          </div>

          <div className="mt-6 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="tech-eyebrow">progress // roadmap</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {roadmapProgress.completed}/{roadmapProgress.total} ·{" "}
                    {roadmapProgress.percentage}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-none bg-muted">
                  <div
                    className="h-full rounded-none bg-ink transition-[width] duration-300"
                    style={{ width: `${roadmapProgress.percentage}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-ink/20 bg-signal/10 px-3 py-2.5">
                <p className="font-mono text-[11px] text-muted-foreground">
                  Public lesson — sign in to track progress on this roadmap.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={signInHref}>./sign-in</Link>
                </Button>
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-10">
            {lesson.toc.length > 0 ? (
              <div className="border border-border bg-card p-4 xl:hidden">
                <StickyTableOfContents
                  items={lesson.toc}
                  activeId={activeId}
                  onNavigate={scrollToHeading}
                />
              </div>
            ) : null}

            {objectives.length > 0 ? (
              <LessonObjectives objectives={objectives} />
            ) : null}

            <LessonStudyPlan
              requiredReading={requiredReading}
              interactiveLabs={interactiveLabs}
              reflectionPrompts={reflectionPrompts}
              searchQueries={searchQueries}
              lessonTitle={lesson.title}
              lab={lesson.lab}
            />

            <LessonStudyHabits />

            <article
              id="lesson-content"
              className={cn("lesson-content mdx-content min-w-0 scroll-mt-28")}
            >
              {children}
            </article>

            <LessonResourcesPanel
              resources={furtherReading}
              heading="further reading"
            />
            <LessonBuildChallenge
              project={lesson.project}
              challenge={lesson.challenge}
            />
            <LessonCompletionButton
              isComplete={isComplete}
              onToggle={toggleComplete}
              isAuthenticated={isAuthenticated}
              signInHref={signInHref}
            />
            <LessonNavigationBar
              roadmapSlug={lesson.roadmap}
              navigation={navigation}
            />
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-8">
              <StickyTableOfContents
                items={lesson.toc}
                activeId={activeId}
                onNavigate={scrollToHeading}
              />
              <div className="space-y-2 text-xs leading-5 text-muted-foreground">
                <p>
                  Press{" "}
                  <kbd className="rounded border px-1 py-0.5 font-mono">
                    Shift
                  </kbd>{" "}
                  +{" "}
                  <kbd className="rounded border px-1 py-0.5 font-mono">?</kbd>{" "}
                  for keyboard shortcuts.
                </p>
                {researchUrl ? (
                  <p>
                    Press{" "}
                    <kbd className="rounded border px-1 py-0.5 font-mono">R</kbd>{" "}
                    to research on Bitcoin Search.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </SiteContainer>
    </>
  );
}
