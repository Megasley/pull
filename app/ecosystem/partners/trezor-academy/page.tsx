import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionDivider, SectionHeader } from "@/components/design-system";
import { FoundingSponsorRecognition } from "@/components/ecosystem/founding-sponsor-recognition";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { getPartnerBySlug } from "@/lib/ecosystem/partners";

export const metadata: Metadata = {
  title: "Trezor Academy · Partners",
  description:
    "Trezor Academy is a Pull Founding Sponsor — supporting the platform as Pull builds infrastructure for developers to learn, build, contribute, and prove their open source work.",
  alternates: { canonical: "/ecosystem/partners/trezor-academy" },
};

const ECOSYSTEM_ROLES = [
  {
    label: "Infrastructure Supporter",
    body: "Trezor Academy's founding sponsorship provides critical runway during Pull's first year, helping us build and maintain the infrastructure that powers structured open source contribution.",
  },
  {
    label: "Ecosystem Bridge",
    body: "Trezor Academy connects its developer community with Pull — giving hardware security enthusiasts a path into open source contribution and a place to prove what they can build.",
  },
  {
    label: "Mission Aligned",
    body: "Both organizations believe in open, verifiable systems. Trezor builds hardware that removes trust assumptions. Pull builds tools that verify contribution. The mission rhymes.",
  },
] as const;

const JOURNEY_STAGES = [
  {
    step: "01",
    label: "Learn",
    body: "Structured roadmaps for Bitcoin, Lightning, and open source fundamentals — built around the skills developers need before they can contribute.",
  },
  {
    step: "02",
    label: "Build",
    body: "Real projects with real constraints. Developer tools, not toy problems. Builders ship things people actually use.",
  },
  {
    step: "03",
    label: "Contribute",
    body: "Live issues on real repositories. Guided first contributions to meaningful codebases — with context and support, not a cold start.",
  },
  {
    step: "04",
    label: "Prove",
    body: "A verifiable record of what developers built and shipped. On-chain or auditable. No résumé required.",
  },
] as const;

export default function TrezorAcademyPartnerPage() {
  // Launching with Thebuidl first — see lib/ecosystem/partners.ts.
  if (getPartnerBySlug("trezor-academy")?.hidden) {
    notFound();
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border py-14 md:py-20">
        <SiteContainer>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl text-center md:text-left">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <Link
                  href="/ecosystem/partners"
                  className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Partners
                </Link>
                <span className="text-muted-foreground/40">/</span>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  ecosystem
                </p>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 md:items-start">
                <div className="dark:bg-brand-paper dark:px-3 dark:py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/trezor-academy-logo.svg"
                    alt="Trezor Academy"
                    className="h-6 w-auto"
                  />
                </div>
                <span className="inline-block w-fit border border-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
                  Founding Sponsor
                </span>
              </div>

              <h1 className="mt-8 text-balance text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.04em]">
                Supporting the next generation of open source builders.
              </h1>

              <p className="mt-5 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground md:mx-0">
                Trezor Academy is a Pull Founding Sponsor — helping us build the infrastructure
                where developers can learn, contribute to real open source projects, and prove their
                work without a résumé.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Button asChild>
                  <a href="https://academy.trezor.io/" target="_blank" rel="noreferrer">
                    Visit Trezor Academy ↗
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ── The Relationship ─────────────────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <div className="max-w-3xl">
            <SectionHeader
              eyebrow="the relationship"
              title="Why Trezor Academy supports Pull"
            />
            <div className="mt-8 space-y-5 font-mono text-sm leading-[1.8] text-muted-foreground">
              <p>
                Learning to code is only the beginning. Developers also need opportunities to build
                real things, contribute to projects that matter, and demonstrate what they are
                capable of — without relying on credentials or closed networks.
              </p>
              <p>
                Trezor Academy exists to educate developers about Bitcoin, hardware wallets, and
                open cryptographic systems. Its graduates are technical, curious, and ready to
                contribute. Pull gives them somewhere to go next.
              </p>
              <p>
                As a Founding Sponsor, Trezor Academy is not just funding a platform — they are
                helping define what a developer ecosystem can look like when it is built on
                verifiable work rather than reputation.
              </p>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ── Ecosystem Role ───────────────────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <SectionHeader
            eyebrow="partnership"
            title="Role in the Pull ecosystem"
          />
          <div className="mt-10 grid border border-border bg-border sm:grid-cols-3" style={{ gap: "1px" }}>
            {ECOSYSTEM_ROLES.map((role) => (
              <div key={role.label} className="flex flex-col gap-3 bg-background p-6">
                <p className="tech-eyebrow">{role.label}</p>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  {role.body}
                </p>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ── Pull Journey ─────────────────────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <SectionHeader
            eyebrow="the mission"
            title="What this support helps build"
            description="Pull is organized around four verbs. Every feature, cohort, and partnership exists to move developers through this sequence."
          />

          <div className="mt-10 border border-border">
            <div className="flex flex-col lg:flex-row">
              {JOURNEY_STAGES.map((stage, i) => (
                <div
                  key={stage.step}
                  className="flex flex-1 flex-col gap-4 border-b border-border p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground/50">
                      {stage.step}
                    </span>
                    {i < JOURNEY_STAGES.length - 1 ? (
                      <span
                        className="ml-auto hidden font-mono text-xs text-muted-foreground/30 lg:block"
                        aria-hidden
                      >
                        →
                      </span>
                    ) : null}
                  </div>
                  <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
                    {stage.label}
                  </p>
                  <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                    {stage.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ── Founding Sponsor Recognition ─────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <div className="flex flex-col items-center gap-8">
            <SectionDivider label="recognized" />
            <FoundingSponsorRecognition
              name="Trezor Academy"
              logoSrc="/trezor-academy-logo.svg"
              year={2026}
              recognitionLabel="Pull Founding Sponsor"
              className="w-full max-w-sm"
            />
            <SectionDivider />
          </div>
        </SiteContainer>
      </section>

      {/* ── Explore Pull CTA ─────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <SiteContainer>
          <SectionHeader
            eyebrow="explore pull"
            title="Ready to start building?"
            description="Pull is free. Start with a roadmap, ship your first project, or find an open issue to contribute to today."
            align="center"
          />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/roadmaps">Start with a roadmap →</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects">Browse projects →</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/issues">Find open issues →</Link>
            </Button>
          </div>
        </SiteContainer>
      </section>
    </>
  );
}
