import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, SectionHeader } from "@/components/design-system";
import { PartnerJourneySteps } from "@/components/ecosystem/partner-journey-steps";
import { SiteContainer } from "@/components/layout/site-container";
import {
  PARTNER_TYPE_LABELS,
  groupPartnersByCategory,
  listPartners,
  type EcosystemPartner,
  type PartnerType,
} from "@/lib/ecosystem/partners";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Partners · Ecosystem",
  description:
    "Organizations and communities working with Pull to place developers into open source contribution programs.",
};

/** founding_sponsor is excluded — it never reaches PartnerCard (filtered
 *  into its own featured, signal-lime hero section below), so it doesn't
 *  need an entry here. One color per remaining tier so the type badge is
 *  scannable across a grid of many partners at a glance. */
const PARTNER_TYPE_BADGE_CLASS: Record<Exclude<PartnerType, "founding_sponsor">, string> = {
  ecosystem_sponsor: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  learning_partner: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  project_partner: "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  strategic_partner: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  community_partner: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

const HOW_PARTNERSHIPS_WORK_STEPS = [
  {
    step: "01",
    label: "Prepare",
    body: "Organizations teach, train, support, or build communities of developers.",
  },
  {
    step: "02",
    label: "Connect",
    body: "Pull provides a clear transition from the program into the open source ecosystem.",
  },
  {
    step: "03",
    label: "Contribute",
    body: "Developers discover real repositories, projects, and opportunities matched to their skills.",
  },
  {
    step: "04",
    label: "Prove",
    body: "GitHub activity becomes a verifiable record of what they have actually built and contributed.",
  },
] as const;

const WHY_PARTNER_BENEFITS = [
  {
    label: "Structured handoff",
    body: "Move developers from your program into real contribution opportunities.",
  },
  {
    label: "Relevant opportunities",
    body: "Help participants discover repositories and issues that match their skills.",
  },
  {
    label: "Simple onboarding",
    body: "Use shared invitation links without creating a separate signup process.",
  },
  {
    label: "Public proof of work",
    body: "Give developers a verifiable record of what they have actually contributed.",
  },
] as const;

function PartnerLogo({
  partner,
  boxClassName,
  imgClassName,
}: {
  partner: EcosystemPartner;
  boxClassName: string;
  imgClassName: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-border bg-background dark:bg-brand-paper",
        boxClassName,
      )}
      aria-hidden
    >
      {partner.logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={partner.logoSrc}
          alt={partner.name}
          className={cn(
            "w-auto max-w-full",
            imgClassName,
            partner.logoLight && "invert",
          )}
        />
      ) : (
        <span className="font-mono text-xs font-bold">{partner.logoInitials}</span>
      )}
    </div>
  );
}

function PartnerCard({ partner }: { partner: EcosystemPartner }) {
  return (
    <li>
      <Link
        href={`/ecosystem/partners/${partner.slug}`}
        className="group flex h-full flex-col gap-5 border border-border bg-background p-6 transition-colors hover:bg-muted/20 sm:p-7"
      >
        <div className="flex items-start gap-4">
          <PartnerLogo partner={partner} boxClassName="h-14 w-24 p-2" imgClassName="h-7" />
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "inline-block border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                partner.partnerType === "founding_sponsor"
                  ? "border-border text-muted-foreground"
                  : PARTNER_TYPE_BADGE_CLASS[partner.partnerType],
              )}
            >
              {PARTNER_TYPE_LABELS[partner.partnerType]}
            </span>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">{partner.name}</h3>
            <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">
              {partner.tagline}
            </p>
          </div>
        </div>

        {partner.journeySteps && partner.journeySteps.length > 0 ? (
          <ol className="border-t border-border pt-5">
            {partner.journeySteps.map((step, index) => {
              const isLast = index === partner.journeySteps!.length - 1;

              return (
                <li key={step} className={cn("relative flex gap-3", !isLast && "pb-4")}>
                  {!isLast ? (
                    <span
                      className="absolute top-[18px] left-[8.5px] h-[calc(100%-14px)] w-px bg-border"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex size-[17px] shrink-0 items-center justify-center border font-mono text-[9px] leading-none",
                      isLast
                        ? "border-ink bg-signal text-signal-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <p className="pt-px font-mono text-xs text-foreground">{step}</p>
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="mt-auto pt-2 font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          View partnership →
        </div>
      </Link>
    </li>
  );
}

export default function EcosystemPartnersPage() {
  const partners = listPartners();
  const founding = partners.filter((partner) => partner.partnerType === "founding_sponsor");
  const otherCategories = groupPartnersByCategory(
    partners.filter((partner) => partner.partnerType !== "founding_sponsor"),
  );

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <SiteContainer className="pt-12">
        <PageHeader
          eyebrow="ecosystem // partners"
          title="Pull Partners"
          description="Organizations and communities working with Pull to help developers move from learning into real open source contribution."
        />
      </SiteContainer>

      {/* ── Featured founding sponsor ────────────────────────────────── */}
      {founding.length > 0 ? (
        <section className="border-b border-border py-14 md:py-16">
          <SiteContainer>
            <div className="space-y-5">
              {founding.map((partner) => (
                <Link
                  key={partner.slug}
                  href={`/ecosystem/partners/${partner.slug}`}
                  className="group grid gap-6 border border-ink bg-signal/10 p-6 transition-colors hover:bg-signal/15 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-10"
                >
                  <PartnerLogo
                    partner={partner}
                    boxClassName="h-20 w-40 p-4"
                    imgClassName="h-9"
                  />
                  <div className="min-w-0">
                    <span className="inline-block border border-ink bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--background)]">
                      {partner.recognitionLabel ?? PARTNER_TYPE_LABELS[partner.partnerType]}
                    </span>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                      {partner.name}
                    </h2>
                    <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
                      {partner.tagline}
                    </p>
                    {partner.supportingText ? (
                      <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
                        {partner.supportingText}
                      </p>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground lg:self-center">
                    View partner →
                  </div>
                </Link>
              ))}
            </div>
          </SiteContainer>
        </section>
      ) : null}

      {/* ── Our partners ──────────────────────────────────────────────── */}
      {otherCategories.length > 0 ? (
        <section className="border-b border-border py-14 md:py-16">
          <SiteContainer>
            <p className="tech-eyebrow">our partners</p>
            <div className="mt-8 space-y-10">
              {otherCategories.map((group) => (
                <div key={group.type}>
                  {otherCategories.length > 1 ? (
                    <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      {group.label}
                    </p>
                  ) : null}
                  <ul className="grid justify-center gap-5 [grid-template-columns:repeat(auto-fit,minmax(360px,560px))]">
                    {group.partners.map((partner) => (
                      <PartnerCard key={partner.slug} partner={partner} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SiteContainer>
        </section>
      ) : null}

      {/* ── How partnerships work ────────────────────────────────────── */}
      <section className="border-b border-border py-14 md:py-16">
        <SiteContainer>
          <SectionHeader
            eyebrow="how it works"
            title="From learning to real contribution."
            description="Pull helps organizations create a structured bridge between developer education, real open source work, and verifiable proof of contribution."
          />
          <div className="mt-10">
            <PartnerJourneySteps steps={HOW_PARTNERSHIPS_WORK_STEPS} />
          </div>
        </SiteContainer>
      </section>

      {/* ── Why partner with Pull ────────────────────────────────────── */}
      <section className="border-b border-border py-14 md:py-16">
        <SiteContainer>
          <SectionHeader
            eyebrow="why partner"
            title="Give your developers somewhere to go next."
            description="Pull gives developer programs and organizations a structured path from learning to meaningful open source contribution."
          />
          <div
            className="mt-10 grid border border-border bg-border sm:grid-cols-2"
            style={{ gap: "1px" }}
          >
            {WHY_PARTNER_BENEFITS.map((item) => (
              <div key={item.label} className="flex flex-col gap-3 bg-background p-6">
                <p className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-foreground uppercase">
                  <span className="text-muted-foreground/50" aria-hidden>
                    →
                  </span>
                  {item.label}
                </p>
                <p className="font-mono text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* ── Growing the ecosystem ────────────────────────────────────── */}
      <section className="border-b border-border py-14 md:py-16">
        <SiteContainer>
          <SectionHeader
            eyebrow="ecosystem"
            title="The network is growing."
            description="Pull is working with developer programs, open source projects, and ecosystem supporters to create more paths into meaningful contribution."
          />
        </SiteContainer>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <SiteContainer>
          <SectionHeader
            eyebrow="partner with pull"
            title="Bring your builders to the next stage."
            description="Whether you run a developer program, support open source projects, or are building tools for developers, Pull can help connect more builders to meaningful open source work."
            align="center"
          />
          <div className="mt-10 flex justify-center">
            <a
              href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent("Partnership inquiry — Pull")}`}
              className="inline-block border border-ink px-6 py-3 font-mono text-xs uppercase tracking-wide transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Become a Pull partner ↗
            </a>
          </div>
        </SiteContainer>
      </section>
    </>
  );
}
