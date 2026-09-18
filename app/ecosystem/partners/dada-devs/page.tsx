import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PartnerCurrentJourney } from "@/components/ecosystem/partner-current-journey";
import { PartnerHeroJourney } from "@/components/ecosystem/partner-hero-journey";
import { PartnerInviteCta, type PartnerCtaState } from "@/components/ecosystem/partner-invite-cta";
import { PartnerJourneySteps } from "@/components/ecosystem/partner-journey-steps";
import { SectionHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getPartnerBySlug } from "@/lib/ecosystem/partners";
import { getUserOrgMembershipBySlug } from "@/lib/partners/memberships";
import { getPartnerOrgBySlug, listOrgSkills } from "@/lib/partners/orgs";

const PAGE_PATH = "/ecosystem/partners/dada-devs";
const GITHUB_URL = "https://github.com/DadaDevelopers";

export const metadata: Metadata = {
  title: "Dada Devs × Pull | From Learning to Open Source",
  description:
    "Dada Devs and Pull help African female engineers move from structured Bitcoin and Lightning training into meaningful open source contribution.",
  alternates: { canonical: PAGE_PATH },
};

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    label: "Complete your pathway",
    body: "Build practical Bitcoin and Lightning skills with Dada Devs.",
  },
  {
    step: "02",
    label: "Join Pull",
    body: "Qualified participants receive an invitation to continue their journey.",
  },
  {
    step: "03",
    label: "Connect GitHub",
    body: "Connect your GitHub account to Pull.",
  },
  {
    step: "04",
    label: "Start contributing",
    body: "Explore open source projects and opportunities relevant to your skills.",
  },
  {
    step: "05",
    label: "Build your proof of work",
    body: "Track your contributions and build a public record of what you have done.",
  },
] as const;

const WHAT_YOU_GET = [
  "Curated contribution opportunities",
  "Projects relevant to your skills",
  "A clear path into open source contribution",
  "GitHub connected contribution tracking",
  "A growing public record of your work",
] as const;

export default async function DadaDevsPartnerPage() {
  const partner = getPartnerBySlug("dada-devs");
  if (!partner) return null;

  const profile = await bootstrapCurrentUserProfile();
  const dbOrg = isDatabaseConfigured() ? await getPartnerOrgBySlug(partner.slug) : null;
  const membership =
    profile && dbOrg ? await getUserOrgMembershipBySlug(profile.id, partner.slug) : null;

  const ctaState: PartnerCtaState = membership
    ? "member"
    : profile
      ? "signed_in_non_member"
      : "signed_out";

  const journeys = partner.journeys ?? [];

  // Admin-configured org skills are the source of truth; each pathway's own
  // skills are only a fallback for when the DB is unreachable.
  const dbSkills = dbOrg ? await listOrgSkills(dbOrg.id) : [];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border py-14 md:py-20">
        <SiteContainer>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="flex items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/ecosystem/partners"
                  className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Partners
                </Link>
                <span className="text-muted-foreground/40">/</span>
                <p className="tech-eyebrow text-[var(--signal)]">Dada Devs × Pull</p>
              </div>

              {partner.logoSrc ? (
                <div className="mx-auto mt-6 w-fit lg:mx-0 dark:bg-brand-paper dark:px-3 dark:py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logoSrc}
                    alt={partner.name}
                    style={{ height: `${2 * (partner.logoScale ?? 1)}rem` }}
                    className={`w-auto ${partner.logoLight ? "invert" : ""}`}
                  />
                </div>
              ) : null}

              <h1 className="mt-6 text-balance text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.04em]">
                {partner.tagline}
              </h1>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Button
                  asChild
                  className="bg-signal border-[var(--signal)] hover:bg-[var(--signal)]/90"
                >
                  <a href={partner.website} target="_blank" rel="noreferrer">
                    Explore Dada Devs ↗
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                    GitHub ↗
                  </a>
                </Button>
              </div>
            </div>

            <PartnerHeroJourney
              className="mx-auto lg:mx-0 lg:justify-self-end"
              nodes={[
                { title: "Learn", subtitle: `with ${partner.name}` },
                { title: "Build skills" },
                { title: "Contribute", subtitle: "with Pull" },
                { title: "Prove your work" },
              ]}
            />
          </div>
        </SiteContainer>
      </section>

      {/* ── About Dada Devs & DadaHub ─────────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div>
              <SectionHeader eyebrow="about" title={`About ${partner.name}`} />
              <p className="mt-6 font-mono text-sm leading-relaxed text-muted-foreground">
                {partner.description}
              </p>
            </div>

            <figure className="border border-border">
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src="/dadahub-nairobi.jpg"
                  alt="DadaHub, Dada Devs' co-working space in Nairobi"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-border px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
                DadaHub, Nairobi — a physical co-working space dedicated to female developers and
                designers building in Bitcoin and open source.
              </figcaption>
            </figure>
          </div>
        </SiteContainer>
      </section>

      {/* ── Learn there. Continue here. ─────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <div className="max-w-3xl">
            <SectionHeader eyebrow="the relationship" title="Learn there. Continue here." />
            <div className="mt-8 space-y-5 font-mono text-sm leading-[1.8] text-muted-foreground">
              <p>
                {partner.name} creates pathways for African female engineers to build practical
                skills through code-first onboarding, mentorship, and ecosystem collaborations in
                Bitcoin and Lightning Network development.
              </p>
              <p>
                After completing a pathway, qualified participants can continue their journey on
                Pull by applying those skills to real open source projects.
              </p>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ── Pathways ──────────────────────────────────────────────────── */}
      {journeys.length > 0 ? (
        <section className="border-b border-border py-16 md:py-20">
          <SiteContainer>
            <SectionHeader
              eyebrow="current journey"
              title={journeys.map((journey) => journey.name).join(" & ")}
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {journeys.map((journey) => (
                <PartnerCurrentJourney
                  key={journey.slug}
                  journey={journey}
                  skills={dbSkills.length > 0 ? dbSkills : journey.skills}
                />
              ))}
            </div>
            <p className="mt-8 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
              Ready to get started? Apply for a pathway directly with Dada Devs.
            </p>
            <div className="mt-5">
              <Button asChild size="sm" className="bg-signal border-[var(--signal)] hover:bg-[var(--signal)]/90">
                <a href="https://dadadevs.com/pathways/" target="_blank" rel="noreferrer">
                  Apply on Dada Devs ↗
                </a>
              </Button>
            </div>
          </SiteContainer>
        </section>
      ) : null}

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <SectionHeader eyebrow="the path" title="How it works" />
          <div className="mt-10">
            <PartnerJourneySteps steps={HOW_IT_WORKS_STEPS} />
          </div>
        </SiteContainer>
      </section>

      {/* ── What participants get ────────────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <SectionHeader eyebrow="on pull" title="Continue building with Pull." />
          <ul className="mt-8 max-w-2xl divide-y divide-border border border-border">
            {WHAT_YOU_GET.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 px-5 py-3.5 font-mono text-sm text-foreground"
              >
                <span className="text-muted-foreground/50" aria-hidden>
                  →
                </span>
                {item}
              </li>
            ))}
          </ul>
        </SiteContainer>
      </section>

      {/* ── Participant CTA ──────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <SiteContainer>
          <div className="mx-auto max-w-xl text-center">
            <SectionHeader
              eyebrow={`already part of ${partner.name.toLowerCase()}?`}
              title="Continue your journey from learning to open source contribution."
              align="center"
            />
            <div className="mt-8 flex flex-col items-center">
              <PartnerInviteCta
                state={ctaState}
                orgSlug={partner.slug}
                orgName={partner.name}
                pagePath={PAGE_PATH}
              />
            </div>
          </div>
        </SiteContainer>
      </section>
    </>
  );
}
