"use client";

import { CheckCircle2 } from "lucide-react";

import { ChapterQuiz } from "@/components/content/chapter-quiz";
import { LessonCompletionButton } from "@/components/content/lesson-completion-button";
import { Badge } from "@/components/ui/badge";
import type { ChapterQuizStatus } from "@/lib/quizzes/storage";
import type {
  ChapterQuizAnswer,
  ChapterQuizSubmissionResult,
  LessonChapterQuiz,
} from "@/types/content";

type ChapterQuizGateProps = {
  quiz: LessonChapterQuiz;
  status: ChapterQuizStatus | null;
  hydrated: boolean;
  canMarkComplete: boolean;
  isComplete: boolean;
  onToggleComplete: () => void;
  isAuthenticated: boolean;
  signInHref: string;
  onSubmit: (
    answers: ChapterQuizAnswer[],
  ) => Promise<ChapterQuizSubmissionResult | null>;
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
  onSubmit,
}: ChapterQuizGateProps) {
  if (!hydrated) {
    return null;
  }

  const quizComplete = isAuthenticated && status === "passed";
  const showQuiz = !quizComplete;

  return (
    <div className="space-y-6">
      {showQuiz ? (
        <ChapterQuiz
          quiz={quiz}
          onSubmit={onSubmit}
          persistResults={isAuthenticated}
          signInHref={signInHref}
        />
      ) : null}

      {quizComplete ? (
        <div className="flex flex-wrap items-center gap-2 border border-ink/20 bg-signal/15 px-4 py-3 shadow-[var(--shadow-off-sm)]">
          <CheckCircle2 className="size-4 text-ink" aria-hidden />
          <Badge
            variant="outline"
            className="rounded-none border-ink/25 bg-background font-mono text-[10px] uppercase"
          >
            chapter check // cleared
          </Badge>
          <p className="font-mono text-[11px] text-muted-foreground">
            Nice — mark-complete is unlocked.
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
            ? "Pass the chapter check to mark this lesson complete."
            : undefined
        }
      />
    </div>
  );
}
