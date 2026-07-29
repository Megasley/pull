"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[pull] route error:", error);
  }, [error]);

  const message = error.message?.toLowerCase() ?? "";
  const isDatabaseIssue =
    message.includes("database_unconfigured") ||
    message.includes("database is not configured");
  const isGithubIssue =
    message.includes("github") &&
    (message.includes("sync") || message.includes("oauth"));

  return (
    <div className="bg-signal relative min-h-[70vh] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="tech-scanline absolute inset-x-0 top-0 h-px bg-ink/40" />
        <div className="tech-grid absolute inset-0 opacity-[0.12]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <p className="tech-eyebrow text-ink/60">runtime exception · recoverable</p>

        <h1 className="mt-4 text-[clamp(3rem,10vw,5.5rem)] leading-[0.92] font-bold tracking-[-0.045em] text-ink">
          500
        </h1>
        <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-ink sm:text-2xl">
          Uncaught exception in the working tree
        </p>
        <p className="mt-3 max-w-xl text-base leading-snug tracking-[-0.01em] text-ink/75">
          Something blew up while rendering this route. The failure was logged.
          You can retry, or head back to safer ground.
          {isDatabaseIssue ? (
            <>
              {" "}
              The database may be misconfigured — check your environment and
              restart the dev server.
            </>
          ) : null}
          {isGithubIssue ? (
            <>
              {" "}
              <Link href="/settings/github" className="underline underline-offset-4">
                GitHub settings
              </Link>{" "}
              may help if sync or OAuth failed.
            </>
          ) : null}
        </p>

        <div className="mt-8 overflow-hidden rounded-none border border-ink/20 bg-ink text-[var(--background)]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="size-2 bg-signal" aria-hidden />
            <span className="font-mono text-[11px] text-white/50">
              pull - zsh - 80x24
            </span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-white/70 sm:text-[13px]">
            <code>
              <span className="text-[var(--signal)]">pull@dev</span>
              <span className="text-white/40">:</span>
              <span className="text-white/80">~</span>
              <span className="text-white/40">$ </span>
              <span className="text-white">./retry --route</span>
              {"\n"}
              <span className="text-white/50">
                Error: {error.message || "Unknown render failure"}
              </span>
              {"\n"}
              {error.digest ? (
                <>
                  <span className="text-white/40">digest: {error.digest}</span>
                  {"\n"}
                </>
              ) : null}
              {"\n"}
              <span className="text-[var(--signal)]">hint:</span> try again, or{" "}
              <span className="text-white">cd /</span>
              {"\n"}
              <span className="text-[var(--signal)]">pull@dev</span>
              <span className="text-white/40">:</span>
              <span className="text-white/80">~</span>
              <span className="text-white/40">$ </span>
              <span className="tech-blink inline-block h-3.5 w-2 bg-white align-middle" />
            </code>
          </pre>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={reset}
            className="h-11 border-ink bg-ink px-5 text-[var(--background)] hover:bg-ink/90"
          >
            ./retry
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 border-ink/30 bg-transparent text-ink hover:bg-ink/5 hover:text-ink"
          >
            <Link href="/">cd ~</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 border-ink/30 bg-transparent text-ink hover:bg-ink/5 hover:text-ink"
          >
            <Link href="/roadmaps">ls ./roadmaps</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
