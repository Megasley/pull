"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleHelp,
  ListOrdered,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

type McqProps = {
  type?: "mcq";
  prompt: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  /** Shown once the learner gets it right. */
  explain?: string;
  /** Shown after a wrong try. Points at the idea, never at the answer. */
  hint?: string;
};

type OrderProps = {
  type: "order";
  prompt: string;
  /** Items in the correct order. The component shuffles them. */
  items: string[];
  explain?: string;
  hint?: string;
};

type CheckProps = McqProps | OrderProps;

/**
 * Quick knowledge check inside a lesson.
 *
 * <Check prompt="…" options={["…", "…"]} answer={1} explain="…" />
 * <Check type="order" prompt="…" items={["first", "second"]} explain="…" />
 */
export function Check(props: CheckProps) {
  return props.type === "order" ? <OrderCheck {...props} /> : <McqCheck {...props} />;
}

function CheckFrame({
  kind,
  prompt,
  status,
  children,
  footer,
}: {
  kind: string;
  prompt: string;
  status: "idle" | "wrong" | "right";
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const Icon = kind === "order" ? ListOrdered : CircleHelp;

  return (
    <section
      className={cn(
        "not-prose my-8 border bg-card transition-colors",
        status === "right"
          ? "border-ink shadow-[var(--shadow-off-sm)]"
          : "border-ink/25",
      )}
    >
      <header className="flex items-start gap-3 border-b border-ink/10 px-4 py-3">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center border",
            status === "right"
              ? "border-ink bg-signal text-signal-foreground"
              : "border-ink/25 bg-muted/50 text-ink",
          )}
        >
          {status === "right" ? (
            <CheckCircle2 className="size-4" aria-hidden />
          ) : (
            <Icon className="size-4" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="tech-eyebrow">
            check // {kind === "order" ? "put in order" : "pick one"}
          </p>
          <p className="mt-1 font-medium leading-snug text-foreground">{prompt}</p>
        </div>
      </header>
      <div className="px-4 py-4">{children}</div>
      {footer}
    </section>
  );
}

function Feedback({
  status,
  explain,
  hint,
}: {
  status: "idle" | "wrong" | "right";
  explain?: string;
  hint?: string;
}) {
  if (status === "right") {
    return (
      <p
        className="mx-4 mb-4 border-l-2 border-ink bg-signal/20 py-2 pl-3 text-sm leading-relaxed text-foreground"
        role="status"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink">
          correct //
        </span>{" "}
        {explain ?? "Nice work."}
      </p>
    );
  }
  if (status === "wrong") {
    return (
      <p
        className="mx-4 mb-4 border-l-2 border-destructive/60 bg-destructive/5 py-2 pl-3 text-sm leading-relaxed text-muted-foreground"
        role="status"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-destructive">
          not yet //
        </span>{" "}
        {hint ?? "Have another look and try again."}
      </p>
    );
  }
  return null;
}

function CheckButton({
  onClick,
  disabled,
  label = "./check",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 border border-ink bg-ink px-4 font-mono text-xs text-background transition-transform active:translate-y-px disabled:opacity-35"
    >
      {label}
    </button>
  );
}

function McqCheck({ prompt, options, answer, explain, hint }: McqProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "wrong" | "right">("idle");
  const [attempt, setAttempt] = useState(0);

  function check() {
    if (selected === null) return;
    setAttempt((n) => n + 1);
    setStatus(selected === answer ? "right" : "wrong");
  }

  const done = status === "right";

  return (
    <CheckFrame
      kind="mcq"
      prompt={prompt}
      status={status}
      footer={
        <>
          <Feedback status={status} explain={explain} hint={hint} />
          {!done ? (
            <div className="border-t border-ink/10 px-4 py-3">
              <CheckButton
                onClick={check}
                disabled={selected === null}
                label={status === "wrong" ? "./try-again" : "./check"}
              />
            </div>
          ) : null}
        </>
      }
    >
      <div
        key={attempt}
        role="radiogroup"
        aria-label={prompt}
        className={cn("space-y-2", status === "wrong" && "ix-shake")}
      >
        {options.map((option, i) => {
          const active = selected === i;
          const isRight = done && i === answer;
          const isWrong = status === "wrong" && active;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={done}
              onClick={() => {
                setSelected(i);
                if (status === "wrong") setStatus("idle");
              }}
              className={cn(
                "flex w-full items-start gap-3 border px-3 py-2.5 text-left text-sm transition-[border-color,background-color,transform]",
                "disabled:cursor-default",
                !done && "hover:-translate-y-px hover:border-ink/50",
                active &&
                  !done &&
                  !isWrong &&
                  "border-ink bg-signal/20 text-foreground",
                !active && !done && "border-border text-muted-foreground",
                isRight && "border-ink bg-signal/30 text-foreground",
                isWrong && "border-destructive/50 bg-destructive/5 text-foreground",
                done && !isRight && "border-border text-muted-foreground opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center border font-mono text-[10px] font-semibold uppercase",
                  active || isRight
                    ? "border-ink bg-signal text-signal-foreground"
                    : "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                {String.fromCharCode(97 + i)}
              </span>
              <span className="flex-1 leading-relaxed">{option}</span>
              {isRight ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden />
              ) : null}
              {isWrong ? (
                <XCircle
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </CheckFrame>
  );
}

/** Deterministic shuffle so the server and the browser render the same order. */
function seededShuffle<T>(items: T[], seedText: string): T[] {
  let seed = 0;
  for (const char of seedText) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // Never start already solved.
  if (result.every((item, i) => item === items[i]) && result.length > 1) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

function OrderCheck({ prompt, items, explain, hint }: OrderProps) {
  const initial = useMemo(() => seededShuffle(items, prompt), [items, prompt]);
  const [order, setOrder] = useState(initial);
  const [status, setStatus] = useState<"idle" | "wrong" | "right">("idle");
  const [attempt, setAttempt] = useState(0);

  const done = status === "right";

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    if (status === "wrong") setStatus("idle");
  }

  function check() {
    setAttempt((n) => n + 1);
    setStatus(order.every((item, i) => item === items[i]) ? "right" : "wrong");
  }

  return (
    <CheckFrame
      kind="order"
      prompt={prompt}
      status={status}
      footer={
        <>
          <Feedback status={status} explain={explain} hint={hint} />
          {!done ? (
            <div className="border-t border-ink/10 px-4 py-3">
              <CheckButton
                onClick={check}
                label={status === "wrong" ? "./try-again" : "./check"}
              />
            </div>
          ) : null}
        </>
      }
    >
      <ol key={attempt} className={cn("space-y-2", status === "wrong" && "ix-shake")}>
        {order.map((item, i) => {
          // Marks show only right after a check; any move resets status to idle.
          const placedRight = item === items[i];
          const showMark = status !== "idle";

          return (
            <li
              key={item}
              className={cn(
                "flex items-center gap-3 border px-3 py-2 text-sm transition-colors",
                done
                  ? "border-ink bg-signal/25 text-foreground"
                  : showMark && placedRight
                    ? "border-ink/60 bg-signal/10 text-foreground"
                    : showMark
                      ? "border-destructive/40 bg-destructive/5 text-foreground"
                      : "border-border bg-background text-foreground",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center border border-ink/25 font-mono text-[10px] font-semibold">
                {i + 1}
              </span>
              <span className="flex-1 leading-snug">{item}</span>
              {!done ? (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Move "${item}" up`}
                    className="flex size-7 items-center justify-center border border-ink/20 text-ink hover:border-ink disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === order.length - 1}
                    aria-label={`Move "${item}" down`}
                    className="flex size-7 items-center justify-center border border-ink/20 text-ink hover:border-ink disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" aria-hidden />
                  </button>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </CheckFrame>
  );
}
