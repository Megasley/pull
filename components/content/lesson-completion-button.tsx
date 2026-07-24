"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, LogIn, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LessonCompletionButtonProps = {
  isComplete: boolean;
  onToggle: () => void;
  isAuthenticated?: boolean;
  signInHref?: string;
  className?: string;
};

const BURST_PARTICLES = [
  { char: "+", x: "-2.4rem", y: "-2.1rem", delay: "0ms" },
  { char: "*", x: "2.2rem", y: "-2.3rem", delay: "40ms" },
  { char: "✓", x: "-0.2rem", y: "-2.8rem", delay: "20ms" },
  { char: "+", x: "-2.8rem", y: "0.4rem", delay: "60ms" },
  { char: "*", x: "2.7rem", y: "0.2rem", delay: "50ms" },
  { char: "1", x: "-1.8rem", y: "2.2rem", delay: "80ms" },
  { char: "0", x: "1.7rem", y: "2.1rem", delay: "70ms" },
  { char: "#", x: "0.1rem", y: "2.7rem", delay: "90ms" },
] as const;

export function LessonCompletionButton({
  isComplete,
  onToggle,
  isAuthenticated = true,
  signInHref = "/sign-in",
  className,
}: LessonCompletionButtonProps) {
  const [celebrating, setCelebrating] = useState(false);
  const wasComplete = useRef(isComplete);

  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      setCelebrating(true);
      const timeout = window.setTimeout(() => setCelebrating(false), 950);
      wasComplete.current = isComplete;
      return () => window.clearTimeout(timeout);
    }

    wasComplete.current = isComplete;
  }, [isComplete]);

  function handleToggle() {
    if (!isComplete) {
      setCelebrating(true);
    }
    onToggle();
  }

  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          "relative rounded-none border border-ink/20 bg-signal/10 p-5",
          className,
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="tech-eyebrow text-ink">progress // sign in</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Reading is public. Sign in to mark lessons complete, sync across
              devices, and unlock your roadmap.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href={signInHref}>
              <LogIn className="size-4" aria-hidden />
              ./sign-in-to-track
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-none border border-border bg-card p-5 transition-[border-color] duration-300",
        isComplete && "border-primary/40",
        celebrating && "lesson-complete-celebrate",
        className,
      )}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="tech-eyebrow">
            {isComplete ? "status // complete" : "status // in-progress"}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {isComplete
              ? "Progress saved to your roadmap."
              : "Finish reading, then mark complete to unlock the next node."}
          </p>
        </div>

        <div className="relative shrink-0 self-start sm:self-auto">
          {celebrating ? (
            <>
              <span className="lesson-complete-ring" aria-hidden />
              <span
                className="lesson-complete-burst pointer-events-none absolute inset-0 z-10"
                aria-hidden
              >
                {BURST_PARTICLES.map((particle, index) => (
                  <span
                    key={`${particle.char}-${index}`}
                    style={
                      {
                        "--burst-x": particle.x,
                        "--burst-y": particle.y,
                        animationDelay: particle.delay,
                      } as CSSProperties
                    }
                  >
                    {particle.char}
                  </span>
                ))}
              </span>
            </>
          ) : null}
          <Button
            type="button"
            variant={isComplete ? "outline" : "default"}
            onClick={handleToggle}
            className="relative shrink-0"
          >
            {isComplete ? (
              <>
                {celebrating ? (
                  <Check className="size-4 lesson-complete-check text-primary" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                {celebrating ? "./complete" : "./mark-incomplete"}
              </>
            ) : (
              <>
                <Check className="size-4" />
                ./mark-complete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
