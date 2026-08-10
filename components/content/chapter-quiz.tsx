"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XP_REWARDS } from "@/lib/xp/config";
import { cn } from "@/lib/utils";
import type { LessonChapterQuiz } from "@/types/content";

type ChapterQuizProps = {
  quiz: LessonChapterQuiz;
  onPassed: (score: number) => void;
  onSkip?: () => void;
  disabled?: boolean;
  /** When false, answers are scored locally only (guest practice mode). */
  persistResults?: boolean;
  signInHref?: string;
};

function optionBadgeClass(selected: boolean, submitted: boolean) {
  if (submitted && selected) {
    return "border-ink/40 bg-ink/10 text-ink";
  }
  if (selected) {
    return "border-ink bg-signal text-ink";
  }
  return "border-border bg-muted/40 text-muted-foreground";
}

export function ChapterQuiz({
  quiz,
  onPassed,
  onSkip,
  disabled = false,
  persistResults = true,
  signInHref,
}: ChapterQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const score = quiz.questions.reduce((total, question) => {
    return answers[question.id] === question.correctOptionId ? total + 1 : total;
  }, 0);

  const passed = score >= quiz.passingScore;
  const xpReward = XP_REWARDS.chapter_quiz_passed;

  const progressLabel = useMemo(() => {
    if (submitted) {
      return passed ? "checkpoint cleared" : "retry available";
    }
    if (answeredCount === totalQuestions) {
      return "ready to submit";
    }
    return `${answeredCount} of ${totalQuestions} locked in`;
  }, [answeredCount, passed, submitted, totalQuestions]);

  function handleSubmit() {
    if (answeredCount < totalQuestions) {
      return;
    }

    setSubmitted(true);
    if (passed && persistResults) {
      onPassed(score);
    }
  }

  const canSkip = persistResults && Boolean(onSkip);

  return (
    <section className="relative overflow-hidden rounded-none border border-ink bg-card shadow-[var(--shadow-off)]">
      <header className="relative z-10 border-b border-ink/15 px-5 pb-6 pt-5 sm:px-6">
        <div className="relative overflow-hidden pb-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--signal)_45%,transparent),transparent_72%)]"
          />
          <div
            aria-hidden
            className="tech-scanline absolute inset-x-0 top-0 h-px bg-ink/25"
          />

          <div className="relative flex flex-wrap items-start justify-between gap-4 pt-0.5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center border border-ink/25 bg-signal text-ink shadow-[var(--shadow-off-sm)]">
                <Trophy className="size-5" aria-hidden />
              </div>
              <div>
                <p className="tech-eyebrow">chapter // boss check</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                  {quiz.title}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-none border-ink/25 bg-background font-mono text-[10px] uppercase tracking-wider"
              >
                {persistResults ? "ranked" : "practice"}
              </Badge>
              {persistResults ? (
                <Badge className="rounded-none border border-ink/20 bg-signal/30 font-mono text-[10px] text-ink uppercase tracking-wider">
                  <Zap className="mr-1 size-3" aria-hidden />+{xpReward} XP
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {persistResults ? (
            <>
              Score <span className="font-semibold text-ink">{quiz.passingScore}</span>{" "}
              of {totalQuestions} to unlock mark-complete — or skip with a warning.
            </>
          ) : (
            <>
              Try the chapter check for free. Sign in to save your score, earn XP, and
              track roadmap progress.
            </>
          )}
        </p>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Target className="size-3 text-ink/70" aria-hidden />
              {progressLabel}
            </span>
            <span>
              pass bar // {quiz.passingScore}/{totalQuestions}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden border border-ink/20 bg-background">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                submitted && passed
                  ? "bg-signal"
                  : submitted
                    ? "bg-destructive/70"
                    : "bg-ink",
              )}
              style={{ width: `${submitted ? 100 : progressPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {quiz.questions.map((question, index) => {
            const answered = Boolean(answers[question.id]);
            const isCorrect =
              submitted && answers[question.id] === question.correctOptionId;
            const isWrong =
              submitted &&
              answers[question.id] &&
              answers[question.id] !== question.correctOptionId;

            return (
              <span
                key={question.id}
                title={`Question ${index + 1}`}
                className={cn(
                  "flex size-6 items-center justify-center border font-mono text-[10px] transition-colors",
                  isCorrect && "border-ink bg-signal text-ink",
                  isWrong && "border-destructive/50 bg-destructive/15 text-destructive",
                  !submitted && answered && "border-ink/40 bg-signal/25 text-ink",
                  !submitted &&
                    !answered &&
                    "border-border bg-muted/40 text-muted-foreground",
                  submitted &&
                    !answered &&
                    "border-border bg-muted/30 text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
            );
          })}
        </div>
      </header>

      <ol className="relative space-y-5 px-5 py-6 sm:px-6">
        {quiz.questions.map((question, index) => {
          const selected = answers[question.id];
          const isCorrect = selected === question.correctOptionId;
          const questionAnswered = Boolean(selected);

          return (
            <li
              key={question.id}
              className={cn(
                "space-y-3 border border-ink/10 bg-background/80 p-4 transition-colors",
                submitted &&
                  questionAnswered &&
                  (isCorrect
                    ? "border-signal/50 bg-signal/10"
                    : "border-destructive/25 bg-destructive/5"),
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center border font-mono text-xs font-semibold",
                    submitted && isCorrect
                      ? "border-ink bg-signal text-ink"
                      : submitted && questionAnswered
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : questionAnswered
                          ? "border-ink/30 bg-ink/5 text-ink"
                          : "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <p className="pt-1 font-medium leading-snug text-foreground">
                  {question.prompt}
                </p>
              </div>

              <div className="space-y-2 pl-11">
                {question.options.map((option) => {
                  const active = selected === option.id;
                  const isOptionCorrect = option.id === question.correctOptionId;
                  const showAsCorrect = submitted && active && isOptionCorrect;
                  const showAsWrong = submitted && active && !isOptionCorrect;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={disabled || submitted}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                      className={cn(
                        "group flex w-full items-start gap-3 border px-3 py-2.5 text-left text-sm transition-all",
                        "disabled:cursor-default",
                        !submitted &&
                          "hover:-translate-y-px hover:border-ink/40 hover:shadow-[var(--shadow-off-sm)]",
                        active &&
                          !submitted &&
                          "border-ink bg-signal/20 text-foreground",
                        !active &&
                          !submitted &&
                          "border-border bg-card text-muted-foreground",
                        showAsCorrect &&
                          "border-ink/40 bg-signal/25 text-foreground shadow-[var(--shadow-off-sm)]",
                        showAsWrong &&
                          "border-destructive/40 bg-destructive/10 text-foreground",
                        submitted && !active && "opacity-70",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center border font-mono text-[11px] font-semibold uppercase",
                          optionBadgeClass(active, submitted),
                        )}
                      >
                        {option.id}
                      </span>
                      <span className="flex-1 leading-relaxed">{option.label}</span>
                      {showAsCorrect ? (
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-ink"
                          aria-hidden
                        />
                      ) : showAsWrong ? (
                        <XCircle
                          className="mt-0.5 size-4 shrink-0 text-destructive"
                          aria-hidden
                        />
                      ) : active && !submitted ? (
                        <Circle
                          className="mt-0.5 size-4 shrink-0 fill-signal text-ink"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {submitted && selected && !isCorrect ? (
                <p className="border-l-2 border-signal/60 bg-signal/10 py-2 pl-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink">
                    hint //
                  </span>{" "}
                  {question.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {submitted ? (
        <div
          className={cn(
            "relative mx-5 mb-5 overflow-hidden border px-4 py-4 sm:mx-6",
            passed
              ? "border-ink/30 bg-signal/20 achievement-unlock"
              : "border-destructive/30 bg-destructive/5",
          )}
        >
          {passed ? (
            <div
              aria-hidden
              className="achievement-unlock-glow pointer-events-none absolute inset-0"
            />
          ) : null}
          <div className="relative flex items-start gap-3">
            {passed ? (
              <div className="flex size-10 shrink-0 items-center justify-center border border-ink/25 bg-signal text-ink achievement-unlock-icon">
                <Sparkles className="size-5" aria-hidden />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center border border-destructive/30 bg-destructive/10">
                <XCircle className="size-5 text-destructive" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold tracking-tight text-ink">
                {passed ? "Checkpoint cleared!" : "Not quite — keep grinding"}
              </p>
              <p className="mt-1 font-mono text-sm">
                score //{" "}
                <span className={passed ? "text-ink" : "text-destructive"}>
                  {score}/{totalQuestions}
                </span>{" "}
                · need {quiz.passingScore}
              </p>
              {passed && persistResults ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Mark-complete unlocked.{" "}
                  <span className="font-mono text-ink">+{xpReward} XP</span> on your
                  profile.
                </p>
              ) : null}
              {!passed ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {persistResults
                    ? "Review the hints and retry, or skip to mark complete anyway."
                    : "Review the hints and try again."}
                </p>
              ) : !persistResults && signInHref ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nice run.{" "}
                  <Link
                    href={signInHref}
                    className="font-semibold text-ink underline underline-offset-2"
                  >
                    Sign in
                  </Link>{" "}
                  to save this result and unlock mark-complete.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <footer className="flex flex-wrap gap-3 border-t border-ink/10 bg-muted/20 px-5 py-4 sm:px-6">
        {!submitted || !passed ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              disabled || answeredCount < totalQuestions || (submitted && passed)
            }
            className="shadow-[var(--shadow-off-sm)]"
          >
            <Zap className="size-4" aria-hidden />
            ./submit-check
          </Button>
        ) : null}
        {submitted && !passed ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            className="border-ink/25"
          >
            ./retry
          </Button>
        ) : null}
        {canSkip ? (
          !showSkipConfirm ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSkipConfirm(true)}
              disabled={disabled}
            >
              skip check
            </Button>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-2 border border-ink/20 bg-signal/15 px-3 py-2">
              <p className="font-mono text-[11px] text-muted-foreground">
                Skip the check? You can still mark complete, but passing is recommended.
              </p>
              <Button type="button" size="sm" variant="outline" onClick={onSkip}>
                confirm skip
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowSkipConfirm(false)}
              >
                cancel
              </Button>
            </div>
          )
        ) : null}
        {!persistResults && signInHref && !submitted ? (
          <Button asChild variant="outline" className="border-ink/25">
            <Link href={signInHref}>./sign-in-to-track</Link>
          </Button>
        ) : null}
      </footer>
    </section>
  );
}
