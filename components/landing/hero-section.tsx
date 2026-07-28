"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { SiteContainer } from "@/components/layout/site-container";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const BOOT_LINES = [
  "> boot pull --mode=contribute",
  "> mount /learn /build /contribute /prove",
  "> sync github credentials … ok",
  "> ready.",
] as const;

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/** True after hydration so typewriter/boot animations can start on the client. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useTypewriter(text: string, enabled: boolean, speed = 55) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTick(i);
      if (i >= text.length) {
        window.clearInterval(id);
      }
    }, speed);

    return () => window.clearInterval(id);
  }, [text, enabled, speed]);

  if (!enabled) {
    return { value: "", done: false };
  }

  const value = text.slice(0, Math.min(tick, text.length));
  return { value, done: tick >= text.length };
}

export function HeroSection() {
  const started = useHydrated();
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [bootTick, setBootTick] = useState(0);

  const title = useTypewriter(siteConfig.name, started && !reduceMotion, 70);
  const tagline = useTypewriter(
    siteConfig.tagline,
    started && (reduceMotion || title.done),
    reduceMotion ? 1 : 28,
  );

  useEffect(() => {
    if (!started || reduceMotion) {
      return;
    }

    let current = 0;
    const id = window.setInterval(() => {
      current += 1;
      setBootTick(current);
      if (current >= BOOT_LINES.length) {
        window.clearInterval(id);
      }
    }, 420);

    return () => window.clearInterval(id);
  }, [started, reduceMotion]);

  const bootIndex = reduceMotion
    ? BOOT_LINES.length
    : Math.min(bootTick, BOOT_LINES.length);

  const displayTitle = reduceMotion
    ? siteConfig.name
    : title.value || (started ? "" : siteConfig.name);
  const displayTagline = reduceMotion ? siteConfig.tagline : tagline.value;
  const showTitleCaret = started && !reduceMotion && !title.done;
  const showTaglineCaret = started && !reduceMotion && title.done && !tagline.done;

  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-signal relative flex min-h-[min(88vh,820px)] w-full flex-col justify-center overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="tech-scanline absolute inset-x-0 top-0 h-px bg-ink/50" />
        <div className="tech-grid absolute inset-0 opacity-[0.14]" />
        <div className="absolute top-6 left-6 size-8 border-t-2 border-l-2 border-ink/45 sm:top-10 sm:left-10" />
        <div className="absolute top-6 right-6 size-8 border-t-2 border-r-2 border-ink/45 sm:top-10 sm:right-10" />
        <div className="absolute bottom-6 left-6 size-8 border-b-2 border-l-2 border-ink/45 sm:bottom-10 sm:left-10" />
        <div className="absolute right-6 bottom-6 size-8 border-r-2 border-b-2 border-ink/45 sm:right-10 sm:bottom-10" />
      </div>

      <SiteContainer className="relative flex flex-col py-20 sm:py-28">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[11px] tracking-[0.14em] text-ink/70 uppercase">
            sys.boot // open-source
            <span className="tech-blink ml-2 inline-block h-2.5 w-2 bg-ink align-middle" />
          </p>
          <span className="border border-ink/35 bg-ink/5 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-ink uppercase">
            beta // curriculum under review
          </span>
        </div>

        <h1
          id="hero-heading"
          className="mt-5 max-w-full text-[clamp(2.5rem,14vw,9.5rem)] leading-[0.88] font-bold tracking-[-0.045em] break-words text-ink"
        >
          {displayTitle}
          {showTitleCaret ? (
            <span className="tech-caret ml-1 inline-block w-[0.08em] bg-ink align-baseline" />
          ) : null}
        </h1>

        <div className="mt-5 h-px w-full max-w-md overflow-hidden bg-ink/15">
          <div
            className={cn(
              "tech-progress h-full w-0 bg-ink",
              started && "tech-progress-run",
              (reduceMotion || title.done) && "tech-progress-done",
            )}
          />
        </div>

        <p className="mt-8 min-h-[2.5em] max-w-xl font-mono text-[clamp(1rem,2vw,1.35rem)] leading-snug tracking-[-0.02em] text-ink">
          {displayTagline}
          {showTaglineCaret ? (
            <span className="tech-caret ml-1 inline-block h-[1em] w-[0.45ch] bg-ink align-[-0.1em]" />
          ) : null}
        </p>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base">
          Learn through structured roadmaps, build real software, contribute to open
          source, and prove your skills through projects and GitHub activity.
        </p>

        <div
          aria-hidden
          className="mt-6 max-w-lg space-y-1 overflow-x-auto font-mono text-[11px] leading-relaxed break-all text-ink/65 sm:text-xs"
        >
          {BOOT_LINES.slice(0, bootIndex).map((line) => (
            <p key={line} className="tech-boot-line">
              {line}
            </p>
          ))}
        </div>

        <div
          className={cn(
            "mt-10 flex flex-wrap gap-3 transition-opacity duration-500",
            reduceMotion || tagline.done || !started ? "opacity-100" : "opacity-0",
          )}
        >
          <Button
            size="lg"
            asChild
            className="h-12 w-full border-ink bg-ink px-6 text-[var(--background)] hover:bg-ink/90 sm:w-auto"
          >
            <Link href="/roadmaps">./start-building</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 w-full border-ink/30 bg-transparent px-6 text-ink hover:bg-ink/5 hover:text-ink sm:w-auto"
          >
            <Link href="#loop">man ./loop</Link>
          </Button>
        </div>
      </SiteContainer>
    </section>
  );
}
