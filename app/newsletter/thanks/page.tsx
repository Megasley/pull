import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Subscribed",
  description: "You're subscribed to the Pull newsletter.",
};

const STEPS = [
  { label: "signup", value: "received" },
  { label: "confirm", value: "pending · check inbox" },
  { label: "status", value: "not yet active" },
] as const;

export default function NewsletterThanksPage() {
  return (
    <div className="brand-fixed bg-signal relative min-h-[70vh] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="tech-scanline absolute inset-x-0 top-0 h-px bg-ink/40" />
        <div className="tech-grid absolute inset-0 opacity-[0.12]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <p className="tech-eyebrow text-ink/60">sys.mail // subscribed</p>

        <h1 className="mt-4 text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-[-0.045em] text-ink">
          You&apos;re on the list.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-snug tracking-[-0.01em] text-ink/75 sm:text-lg">
          One more step — we&apos;ve sent a confirmation link to your inbox.
          Click it to start receiving updates from Pull.
        </p>

        <div className="brand-fixed mt-8 overflow-hidden rounded-none border border-ink/20 bg-ink text-[var(--background)]">
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
              <span className="text-white">cat ./newsletter/status</span>
              {"\n"}
              {STEPS.map((step) => (
                <span key={step.label}>
                  {step.label}: {step.value}
                  {"\n"}
                </span>
              ))}
              {"\n"}
              <span className="text-[var(--signal)]">hint:</span> no email? check
              spam, or resend from the site footer.
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
            asChild
            className="h-11 px-5"
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
