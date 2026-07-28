import Link from "next/link";

import { Reveal, RevealStagger } from "@/components/landing/reveal";
import { SiteContainer } from "@/components/layout/site-container";

const STEPS = [
  {
    id: "01",
    cmd: "./learn",
    title: "Learn on roadmaps",
    description:
      "Follow structured paths with lessons, milestones, and clear unlocks - starting with Bitcoin.",
    href: "/roadmaps",
    linkLabel: "ls ./roadmaps",
  },
  {
    id: "02",
    cmd: "./build",
    title: "Build real software",
    description:
      "Build portfolio-ready software, submit proof of work, and get reviewed as you level up.",
    href: "/projects",
    linkLabel: "ls ./projects",
  },
  {
    id: "03",
    cmd: "./contribute",
    title: "Contribute to OSS",
    description:
      "Discover repos and issues matched to your skills, then sync your GitHub activity.",
    href: "/discover",
    linkLabel: "cd ./discover",
  },
  {
    id: "04",
    cmd: "./prove",
    title: "Prove it in public",
    description:
      "Publish a builder portfolio with PRs, reputation, score, and a timeline of real work.",
    href: "/roadmaps",
    linkLabel: "./start-building",
  },
] as const;

export function BuilderLoopSection() {
  return (
    <section
      id="loop"
      aria-labelledby="builder-loop-heading"
      className="border-b border-border"
    >
      <SiteContainer className="py-16 sm:py-20">
        <Reveal variant="clip">
          <p className="tech-eyebrow">pipeline // builder loop</p>
        </Reveal>
        <Reveal variant="up" delayMs={80}>
          <h2
            id="builder-loop-heading"
            className="mt-3 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em]"
          >
            From learning to verifiable open source credibility
          </h2>
        </Reveal>
        <Reveal variant="fade" delayMs={140}>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pull isn&apos;t another course catalog. It&apos;s a{" "}
            <code className="rounded-none border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
              while(true)
            </code>{" "}
            loop of learning, building, contributing, and proving what you can do.
          </p>
        </Reveal>

        <RevealStagger
          className="mt-12 border border-border"
          variant="left"
          stepMs={110}
        >
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={
                index === 0
                  ? "group grid gap-4 px-4 py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[5.5rem_1fr_auto] sm:items-start sm:gap-8 sm:px-6 sm:py-7"
                  : "group grid gap-4 border-t border-border px-4 py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[5.5rem_1fr_auto] sm:items-start sm:gap-8 sm:px-6 sm:py-7"
              }
            >
              <div className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                <span className="text-foreground">{step.id}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground normal-case tracking-normal">
                  {step.cmd}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                  {step.description}
                </p>
              </div>
              <Link
                href={step.href}
                className="font-mono text-[11px] tracking-[0.12em] text-foreground uppercase transition-opacity hover:opacity-70 sm:pt-1 sm:self-center"
              >
                {step.linkLabel} →
              </Link>
            </div>
          ))}
        </RevealStagger>
      </SiteContainer>
    </section>
  );
}
