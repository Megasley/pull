import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "404 - Segment not found",
};

const STACK_TRACE = [
  "Error: ENOENT: no such file or directory, open '/dev/null/expectations'",
  "    at Kernel.resolveRoute (pull://runtime/router.ts:404:1)",
  "    at async Dispatcher.dispatch (pull://runtime/dispatch.ts:13:37)",
  "    at async Hope.sprinkle (pull://human/optimism.ts:1:1)",
] as const;

const HINTS = [
  { label: "cwd", value: "/u/lost-contributor" },
  { label: "errno", value: "404" },
  { label: "syscall", value: "navigate" },
  { label: "path", value: "<missing>" },
] as const;

export default function NotFound() {
  return (
    <div className="bg-signal relative min-h-[70vh] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="tech-scanline absolute inset-x-0 top-0 h-px bg-ink/40" />
        <div className="tech-grid absolute inset-0 opacity-[0.12]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <p className="tech-eyebrow text-ink/60">kernel panic · soft mode</p>

        <h1 className="mt-4 text-[clamp(4rem,12vw,7rem)] leading-[0.88] font-bold tracking-[-0.045em] text-ink">
          404
        </h1>
        <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-ink sm:text-2xl">
          Segment fault: page not in working tree
        </p>
        <p className="mt-3 max-w-xl text-base leading-snug tracking-[-0.01em] text-ink/75">
          We looked in{" "}
          <code className="rounded-none bg-ink/10 px-1.5 py-0.5 font-mono text-[0.85em]">
            HEAD
          </code>
          ,{" "}
          <code className="rounded-none bg-ink/10 px-1.5 py-0.5 font-mono text-[0.85em]">
            origin/main
          </code>
          , and under the couch. No commit contained this route.
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
              <span className="text-white">cat ./requested-route</span>
              {"\n"}
              {STACK_TRACE.map((line) => (
                <span key={line}>
                  {line}
                  {"\n"}
                </span>
              ))}
              {"\n"}
              <span className="text-[var(--signal)]">hint:</span> try{" "}
              <span className="text-white">git checkout --ours reality</span>
              {"\n"}
              <span className="text-[var(--signal)]">pull@dev</span>
              <span className="text-white/40">:</span>
              <span className="text-white/80">~</span>
              <span className="text-white/40">$ </span>
              <span className="tech-blink inline-block h-3.5 w-2 bg-white align-middle" />
            </code>
          </pre>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {HINTS.map((hint) => (
            <div
              key={hint.label}
              className="rounded-none border border-ink/15 bg-ink/5 px-3 py-2.5 font-mono text-xs text-ink"
            >
              <dt className="text-ink/55">{hint.label}</dt>
              <dd className="mt-1">{hint.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            asChild
            className="h-11 border-ink bg-ink px-5 text-[var(--background)] hover:bg-ink/90"
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
          <Button
            asChild
            variant="outline"
            className="h-11 border-ink/30 bg-transparent text-ink hover:bg-ink/5 hover:text-ink"
          >
            <Link href="/projects">ls ./projects</Link>
          </Button>
        </div>

        <p className="mt-8 font-mono text-[11px] text-ink/50">
          exit code: 404 · no core dump written (we respect your disk)
        </p>
      </div>
    </div>
  );
}
