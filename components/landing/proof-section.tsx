import Link from "next/link";

import { DemoProfilePreview } from "@/components/landing/demo-profile-preview";
import { Reveal, RevealStagger } from "@/components/landing/reveal";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { DEMO_PROFILE_USERNAME } from "@/lib/demo/constants";

const PROOF_ITEMS = [
  {
    cmd: "portfolio",
    title: "Public builder profile",
    description:
      "A shareable /u/username page with skills, projects, repos, and your contribution story.",
  },
  {
    cmd: "prs",
    title: "PR portfolio",
    description:
      "Surface merged pull requests and highlight the work that actually shipped upstream.",
  },
  {
    cmd: "score",
    title: "Builder score & reputation",
    description:
      "Track credibility from learning progress, submissions, and open source activity.",
  },
  {
    cmd: "timeline",
    title: "Activity timeline",
    description:
      "One feed for commits, issues, reviews, projects, and roadmap completions.",
  },
] as const;

export function ProofSection() {
  return (
    <section
      id="proof"
      aria-labelledby="proof-heading"
      className="bg-ink text-[var(--background)]"
    >
      <SiteContainer className="relative overflow-hidden py-16 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="tech-grid absolute inset-0 opacity-[0.08] invert" />
        </div>

        <div className="relative">
          <Reveal variant="clip">
            <p className="font-mono text-[11px] tracking-[0.14em] text-[var(--signal)] uppercase">
              surfaces // portfolio
            </p>
          </Reveal>

          <div className="mt-3 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
            <div>
              <Reveal variant="up" delayMs={90}>
                <h2
                  id="proof-heading"
                  className="max-w-3xl text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em]"
                >
                  Your work becomes a public builder identity
                </h2>
              </Reveal>
              <Reveal variant="fade" delayMs={150}>
                <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-white/65 sm:text-base">
                  Courses end with a certificate. Pull ends with evidence: a portfolio
                  others can verify. Show employers, maintainers, grant programs, and
                  communities what you&apos;ve actually built.
                </p>
              </Reveal>
              <Reveal variant="fade" delayMs={190}>
                <p className="mt-4 font-mono text-xs leading-relaxed text-white/45">
                  Example profile:{" "}
                  <Link
                    href={`/u/${DEMO_PROFILE_USERNAME}`}
                    className="text-[var(--signal)] underline decoration-[var(--signal)]/40 underline-offset-4 hover:decoration-[var(--signal)]"
                  >
                    /u/{DEMO_PROFILE_USERNAME}
                  </Link>
                </p>
              </Reveal>
            </div>

            <Reveal variant="zoom" delayMs={120}>
              <DemoProfilePreview />
            </Reveal>
          </div>

          <RevealStagger
            className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2"
            itemClassName="h-full bg-ink"
            variant="zoom"
            stepMs={100}
          >
            {PROOF_ITEMS.map((item) => (
              <div key={item.cmd} className="h-full bg-ink px-5 py-6 sm:px-6 sm:py-7">
                <p className="font-mono text-[11px] tracking-[0.14em] text-[var(--signal)] uppercase">
                  ./{item.cmd}
                </p>
                <h3 className="mt-3 text-lg font-bold tracking-[-0.03em] sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {item.description}
                </p>
              </div>
            ))}
          </RevealStagger>

          <Reveal variant="up" delayMs={80}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                asChild
                className="h-12 w-full border-[var(--signal)] bg-[var(--signal)] px-6 text-ink hover:bg-[var(--signal)]/90 sm:w-auto"
              >
                <Link href="/roadmaps">./start-building</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 w-full border-white/25 bg-transparent px-6 text-[var(--background)] hover:bg-white/5 hover:text-[var(--background)] sm:w-auto"
              >
                <Link href={`/u/${DEMO_PROFILE_USERNAME}`}>
                  ./view-demo-profile
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 w-full border-white/25 bg-transparent px-6 text-[var(--background)] hover:bg-white/5 hover:text-[var(--background)] sm:w-auto"
              >
                <Link href="/sign-in">./auth --github</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </SiteContainer>
    </section>
  );
}
