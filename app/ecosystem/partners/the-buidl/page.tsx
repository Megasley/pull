import type { Metadata } from "next";
import Link from "next/link";

import { PartnerCurrentJourney } from "@/components/ecosystem/partner-current-journey";
import { PartnerHeroJourney } from "@/components/ecosystem/partner-hero-journey";
import { PartnerInviteCta, type PartnerCtaState } from "@/components/ecosystem/partner-invite-cta";
import { PartnerJourneySteps } from "@/components/ecosystem/partner-journey-steps";
import { DiscoveryRepoCard } from "@/components/discovery/discovery-repo-card";
import { SectionHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getPartnerBySlug } from "@/lib/ecosystem/partners";
import { getUserOrgMembershipBySlug } from "@/lib/partners/memberships";
import { pickRelevantRepositories } from "@/lib/partners/opportunities";
import { getPartnerOrgBySlug, listOrgSkills } from "@/lib/partners/orgs";

const PAGE_PATH = "/ecosystem/partners/the-buidl";

export const metadata: Metadata = {
  title: "Thebuidl × Pull | From Learning to Open Source",
  description:
    "Thebuidl and Pull help developers move from structured learning into meaningful open source contribution.",
  alternates: { canonical: PAGE_PATH },
};

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    label: "Complete your pathway",
    body: "Build practical skills with Thebuidl.",
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

export default async function TheBuidlPartnerPage() {
  const partner = getPartnerBySlug("the-buidl");
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

  const journey = partner.journeys?.[0];

  // Admin-configured org skills are the source of truth; the static journey's
  // skills are only a fallback for when the DB is unreachable.
  const dbSkills = dbOrg ? await listOrgSkills(dbOrg.id) : [];
  const skills = dbSkills.length > 0 ? dbSkills : (journey?.skills ?? []);
  const relevantRepositories = pickRelevantRepositories(skills);

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
                <p className="tech-eyebrow text-[var(--signal)]">Thebuidl × Pull</p>
              </div>

              {partner.logoSrc ? (
                <div className="mx-auto mt-6 w-fit lg:mx-0 dark:bg-brand-paper dark:px-3 dark:py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logoSrc}
                    alt={partner.name}
                    className={`h-8 w-auto ${partner.logoLight ? "invert" : ""}`}
                  />
                </div>
              ) : null}

              <h1 className="mt-6 text-balance text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.04em]">
                From learning to open source.
              </h1>

              <p className="mt-5 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground lg:mx-0">
                Thebuidl helps developers build practical skills. Pull helps them take the next
                step by contributing to real open source projects.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Button
                  asChild
                  className="bg-signal border-[var(--signal)] hover:bg-[var(--signal)]/90"
                >
                  <a href={partner.website} target="_blank" rel="noreferrer">
                    Explore Thebuidl ↗
                  </a>
                </Button>
              </div>
            </div>

            <PartnerHeroJourney
              className="mx-auto lg:mx-0"
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

      {/* ── Learn there. Continue here. ─────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <div className="max-w-3xl">
            <SectionHeader eyebrow="the relationship" title="Learn there. Continue here." />
            <div className="mt-8 space-y-5 font-mono text-sm leading-[1.8] text-muted-foreground">
              <p>
                {partner.name} helps developers build practical skills through structured learning
                experiences.
              </p>
              <p>
                After completing a pathway, qualified participants can continue their journey on
                Pull by applying those skills to real open source projects.
              </p>
            </div>
          </div>
        </SiteContainer>
      </section>

      {/* ── Current Journey ──────────────────────────────────────────── */}
      {journey ? (
        <section className="border-b border-border py-16 md:py-20">
          <SiteContainer>
            <SectionHeader eyebrow="current journey" title={journey.name} />
            <div className="mt-8">
              <PartnerCurrentJourney
                journey={journey}
                skills={skills}
                orgSlug={partner.slug}
                orgName={partner.name}
                ctaState={ctaState}
                pagePath={PAGE_PATH}
              />
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

      {/* ── Put your skills to work ──────────────────────────────────── */}
      {journey ? (
        <section className="border-b border-border py-16 md:py-20">
          <SiteContainer>
            <SectionHeader
              eyebrow="open source contributions"
              title="Put your skills to work."
              description="Take what you have learned and apply it to real open source projects."
            />

            <div className="mt-6 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-signal/10 border-[var(--signal)]/40 border px-2 py-0.5 font-mono text-[10px] text-foreground uppercase tracking-wide"
                >
                  {skill}
                </span>
              ))}
            </div>

            {relevantRepositories.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relevantRepositories.map((repository, i) => (
                  <DiscoveryRepoCard key={repository.id} repository={repository} index={i} />
                ))}
              </div>
            ) : null}

            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Contribution opportunities are available to qualified participants.
            </p>
          </SiteContainer>
        </section>
      ) : null}

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

      {/* ── About The Buidl ──────────────────────────────────────────── */}
      <section className="border-b border-border py-16 md:py-20">
        <SiteContainer>
          <div className="max-w-2xl">
            <SectionHeader eyebrow="about" title={`About ${partner.name}`} />
            <p className="mt-6 font-mono text-sm leading-relaxed text-muted-foreground">
              {partner.description}
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" size="sm">
                <a href={partner.website} target="_blank" rel="noreferrer">
                  Visit {partner.name} ↗
                </a>
              </Button>
            </div>
          </div>
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
                variant="final"
              />
            </div>
          </div>
        </SiteContainer>
      </section>
    </>
  );
}
