"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PlayerScene = {
  say: string;
  visual: ReactNode;
};

type ExplainerPlayerProps = {
  title: string;
  scenes: PlayerScene[];
};

/** Reading time for a caption: about 2.6 words per second, never under 3.5s. */
function sceneDuration(say: string) {
  const words = say.trim().split(/\s+/).length;
  return Math.max(3500, Math.round((words / 2.6) * 1000) + 1200);
}

function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

const noSubscribe = () => () => {};

export function ExplainerPlayer({ title, scenes }: ExplainerPlayerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [narrate, setNarrate] = useState(false);
  // False on the server, real value in the browser, without a hydration mismatch.
  const speechSupported = useSyncExternalStore(noSubscribe, canSpeak, () => false);
  const timer = useRef<number | null>(null);

  const last = scenes.length - 1;
  const atEnd = index === last;
  const scene = scenes[index];

  useEffect(() => {
    return () => {
      if (canSpeak()) window.speechSynthesis.cancel();
    };
  }, []);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.min(Math.max(next, 0), last));
    },
    [last],
  );

  // Advance while playing. With narration on, the voice sets the pace.
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);

    if (narrate && canSpeak()) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(scene.say);
      utterance.rate = 1;
      if (playing) {
        utterance.onend = () => {
          if (index < last) setIndex(index + 1);
          else setPlaying(false);
        };
      }
      window.speechSynthesis.speak(utterance);
      return;
    }

    if (!playing) return;

    timer.current = window.setTimeout(() => {
      if (index < last) setIndex(index + 1);
      else setPlaying(false);
    }, sceneDuration(scene.say));

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, playing, narrate, scene.say, last]);

  function togglePlay() {
    if (atEnd && !playing) {
      setIndex(0);
      setPlaying(true);
      return;
    }
    setPlaying((value) => !value);
  }

  function toggleNarrate() {
    if (narrate && canSpeak()) window.speechSynthesis.cancel();
    setNarrate((value) => !value);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPlaying(false);
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPlaying(false);
      go(index - 1);
    }
  }

  return (
    <figure
      className="not-prose my-8 border border-ink bg-card shadow-[var(--shadow-off)] outline-none focus-visible:ring-2 focus-visible:ring-signal"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-roledescription="explainer"
      aria-label={title}
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink/15 px-4 py-2.5">
        <p className="tech-eyebrow truncate">explainer // {title}</p>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
          {index + 1}/{scenes.length}
        </span>
      </header>

      <div className="ix-explainer-screen" key={`v-${index}`}>
        {scene.visual}
      </div>

      <div className="flex gap-1 px-4 pt-3" aria-hidden>
        {scenes.map((_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => {
              setPlaying(false);
              go(i);
            }}
            className="relative h-1.5 flex-1 overflow-hidden bg-muted"
          >
            {i < index ? <span className="absolute inset-0 bg-ink" /> : null}
            {i === index ? (
              <span
                key={`${index}-${playing}`}
                className={cn(
                  "absolute inset-0 bg-ink",
                  playing && !narrate && "ix-progress-fill",
                )}
                style={
                  playing && !narrate
                    ? { animationDuration: `${sceneDuration(scene.say)}ms` }
                    : undefined
                }
              />
            ) : null}
          </button>
        ))}
      </div>

      <figcaption
        key={`s-${index}`}
        className="ix-explainer-say min-h-[4.5rem] px-4 pt-3 pb-1 text-[15px] leading-relaxed text-foreground"
        aria-live="polite"
      >
        {scene.say}
      </figcaption>

      <div className="flex items-center gap-2 px-4 pt-2 pb-4">
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex h-9 items-center gap-2 border border-ink bg-signal px-3 font-mono text-xs text-signal-foreground shadow-[var(--shadow-off-sm)] transition-transform active:translate-x-px active:translate-y-px active:shadow-none"
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : atEnd ? (
            <RotateCcw className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
          {playing
            ? "./pause"
            : atEnd
              ? "./replay"
              : index === 0
                ? "./play"
                : "./resume"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            go(index - 1);
          }}
          disabled={index === 0}
          aria-label="Previous scene"
          className="inline-flex size-9 items-center justify-center border border-ink/25 text-ink transition-colors hover:border-ink disabled:opacity-35"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            go(index + 1);
          }}
          disabled={atEnd}
          aria-label="Next scene"
          className="inline-flex size-9 items-center justify-center border border-ink/25 text-ink transition-colors hover:border-ink disabled:opacity-35"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        {speechSupported ? (
          <button
            type="button"
            onClick={toggleNarrate}
            aria-pressed={narrate}
            className={cn(
              "ml-auto inline-flex h-9 items-center gap-2 border px-3 font-mono text-xs transition-colors",
              narrate
                ? "border-ink bg-ink text-background"
                : "border-ink/25 text-muted-foreground hover:border-ink hover:text-ink",
            )}
          >
            {narrate ? (
              <Volume2 className="size-4" aria-hidden />
            ) : (
              <VolumeX className="size-4" aria-hidden />
            )}
            narrate
          </button>
        ) : null}
      </div>
    </figure>
  );
}
