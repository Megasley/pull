import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Subscribed",
  description: "You're subscribed to the Pull newsletter.",
  robots: { index: false },
};

const STEPS = [
  {
    title: "Signed up",
    body: "We've got your email address.",
    state: "done",
  },
  {
    title: "Confirm your email",
    body: "Click the link in the email we just sent. Not there in a few minutes? Check your spam folder.",
    state: "current",
  },
  {
    title: "Get updates",
    body: "New roadmaps, projects, and contribution opportunities. Unsubscribe anytime.",
    state: "next",
  },
] as const;

export default function NewsletterThanksPage() {
  return (
    <SiteContainer className="pt-16 pb-24 sm:pt-20">
      <div className="mx-auto max-w-2xl">
        <div
          className="flex size-12 items-center justify-center border border-ink bg-signal text-signal-foreground shadow-[var(--shadow-off-sm)]"
          aria-hidden
        >
          <Check className="size-6" strokeWidth={2.5} />
        </div>

        <p className="tech-eyebrow mt-8">newsletter // subscribed</p>
        <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.04em] text-balance">
          Thanks for subscribing.
        </h1>
        <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
          One last step: confirm your email address so we can start sending you updates
          from Pull.
        </p>

        <ol className="mt-10 border border-border" aria-label="Subscription progress">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              aria-current={step.state === "current" ? "step" : undefined}
              className={cn(
                "flex gap-4 border-border px-5 py-4 [&:not(:first-child)]:border-t",
                step.state === "current" && "bg-card",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center border font-mono text-[11px] font-bold",
                  step.state === "done" &&
                    "border-ink bg-signal text-signal-foreground",
                  step.state === "current" && "border-ink",
                  step.state === "next" && "border-border text-muted-foreground",
                )}
              >
                {step.state === "done" ? (
                  <Check className="size-3.5" strokeWidth={3} aria-label="Done" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-semibold tracking-[-0.01em]",
                    step.state === "next" && "text-muted-foreground",
                  )}
                >
                  {step.title}
                  {step.state === "current" ? (
                    <span className="ml-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                      next
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/roadmaps">
              Explore roadmaps
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </SiteContainer>
  );
}
