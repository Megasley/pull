"use client";

import { useId, useState } from "react";
import {
  BookOpen,
  Brain,
  ChevronDown,
  FlaskConical,
  ListOrdered,
} from "lucide-react";

import { cn } from "@/lib/utils";

const HABITS = [
  {
    id: "mental-model",
    title: "Worked mental model",
    icon: Brain,
    body: "Re-read the diagrams in this lesson once out loud in plain language. If you cannot explain the flow to a friend without jargon, pause and revisit the Mastering Bitcoin / Mastering Lightning chapters linked in Resources. Chapter references are intentional, not decorative.",
    steps: null as string[] | null,
  },
  {
    id: "hands-on",
    title: "Hands-on habit",
    icon: FlaskConical,
    body: "Every protocol idea should be paired with one local experiment. That habit turns reading into builder instinct.",
    steps: [
      "Reproduce the happy path on regtest (or Polar for Lightning)",
      "Break it on purpose (wrong fee, expired invoice, offline peer)",
      "Write down what error you saw and which layer produced it (wallet, node, mempool, peer)",
    ],
  },
  {
    id: "glossary",
    title: "Glossary check",
    icon: BookOpen,
    body: "Pick three terms from this lesson and define them in one sentence each without opening notes. Weak definitions mean the lesson is not finished yet.",
    steps: null as string[] | null,
  },
  {
    id: "resource-order",
    title: "Resource order",
    icon: ListOrdered,
    body: "Use Resources in order: narrative book chapter first, then BIP/BOLT for precision, then implementation docs for commands. Jumping straight to RPC flags without the mental model creates brittle knowledge.",
    steps: null as string[] | null,
  },
] as const;

type LessonStudyHabitsProps = {
  className?: string;
};

/**
 * Shared study method for every lesson — not lesson-specific curriculum.
 * Collapsed by default so it does not dominate the reading path.
 */
export function LessonStudyHabits({ className }: LessonStudyHabitsProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn("border border-border bg-card", className)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-6 sm:py-5"
      >
        <div className="min-w-0 max-w-2xl">
          <p className="tech-eyebrow text-foreground">study // habits</p>
          <h2
            id={headingId}
            className="mt-2 text-base font-semibold tracking-tight text-foreground"
          >
            How to study this lesson
          </h2>
          {open ? (
            <p className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">
              Same method on every lesson — not part of the curriculum text.
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-border px-5 pb-6 sm:px-6"
      >
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {HABITS.map((habit, index) => {
            const Icon = habit.icon;
            return (
              <li
                key={habit.id}
                className="flex gap-3 border border-border/70 bg-background p-4"
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center border border-border font-mono text-[10px] tracking-wide text-muted-foreground"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="size-3.5 shrink-0 text-ink" aria-hidden />
                    {habit.title}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {habit.body}
                  </p>
                  {habit.steps ? (
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                      {habit.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
