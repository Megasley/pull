"use client";

import { CheckCircle2, SkipForward } from "lucide-react";

import { ChapterQuiz } from "@/components/content/chapter-quiz";
import { LessonCompletionButton } from "@/components/content/lesson-completion-button";
import { Badge } from "@/components/ui/badge";
import type { ChapterQuizStatus } from "@/lib/quizzes/storage";
import type { LessonChapterQuiz } from "@/types/content";

type ChapterQuizGateProps = {
  quiz: LessonChapterQuiz;
  status: ChapterQuizStatus | null;
  hydrated: boolean;
  canMarkComplete: boolean;
  isComplete: boolean;
  onToggleComplete: () => void;
  isAuthenticated: boolean;
  signInHref: string;
  onPassed: (score: number) => void;
  onSkip: () => void;
};

export function ChapterQuizGate({
  quiz,
  status,
  hydrated,
  canMarkComplete,
  isComplete,
  onToggleComplete,
  isAuthenticated,
  signInHref,
  onPassed,
  onSkip,
}: ChapterQuizGateProps) {
  if (!hydrated) {
    return null;
  }

  const quizComplete =
    isAuthenticated && (status === "passed" || status === "skipped");
  const showQuiz = !quizComplete;

  return (
    <div className="space-y-6">
      {showQuiz ? (
        <ChapterQuiz
          quiz={quiz}
          onPassed={onPassed}
          onSkip={isAuthenticated ? onSkip : undefined}
          persistResults={isAuthenticated}
          signInHref={signInHref}
        />
      ) : null}

      {quizComplete ? (
        <div className="flex flex-wrap items-center gap-2 border border-ink/20 bg-signal/15 px-4 py-3 shadow-[var(--shadow-off-sm)]">
          {status === "passed" ? (
            <CheckCircle2 className="size-4 text-ink" aria-hidden />
          ) : (
            <SkipForward className="size-4 text-muted-foreground" aria-hidden />
          )}
          <Badge
            variant="outline"
            className="rounded-none border-ink/25 bg-background font-mono text-[10px] uppercase"
          >
            chapter check // {status === "passed" ? "cleared" : "skipped"}
          </Badge>
          <p className="font-mono text-[11px] text-muted-foreground">
            {status === "passed"
              ? "Nice — mark-complete is unlocked."
              : "Skipped — you can still finish the lesson."}
          </p>
        </div>
      ) : null}

      <LessonCompletionButton
        isComplete={isComplete}
        onToggle={onToggleComplete}
        isAuthenticated={isAuthenticated}
        signInHref={signInHref}
        disabled={!canMarkComplete}
        disabledReason={
          !canMarkComplete
            ? "Pass the chapter check or confirm skip to mark this lesson complete."
            : undefined
        }
      />
    </div>
  );
}
