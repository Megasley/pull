export type PartnerType =
  | "founding_sponsor"
  | "learning_partner"
  | "ecosystem_sponsor"
  | "strategic_partner"
  | "community_partner";

/**
 * A pathway or cohort a partner runs whose graduates continue on Pull.
 * Config-driven (not DB) — same tier as the `comingSoon` nav flags. Lets a
 * partner page describe its active program without the page architecture
 * being hardcoded to any one pathway.
 */
export type PartnerJourneyStatus = "active" | "applications_closed" | "coming_soon";

export type PartnerJourney = {
  slug: string;
  name: string;
  status: PartnerJourneyStatus;
  summary: string;
  /** Skills relevant to this journey's contribution opportunities. */
  skills: string[];
};

export const PARTNER_JOURNEY_STATUS_LABELS: Record<PartnerJourneyStatus, string> = {
  active: "Contribution phase active",
  applications_closed: "Applications closed",
  coming_soon: "Coming soon",
};

export type EcosystemPartner = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  website: string;
  logoInitials: string;
  logoSrc?: string;
  /** Set when logoSrc is a light/white-ink mark, so it needs the opposite invert direction of a dark-ink logo. */
  logoLight?: boolean;
  partnerType: PartnerType;
  /** Human-readable recognition label, e.g. "Pull Founding Sponsor". */
  recognitionLabel?: string;
  /** Year the partnership began. */
  partnershipStartYear?: number;
  /** Active pathways/cohorts whose graduates continue on Pull. */
  journeys?: PartnerJourney[];
};

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  founding_sponsor: "Founding Sponsor",
  learning_partner: "Learning Partner",
  ecosystem_sponsor: "Ecosystem Sponsor",
  strategic_partner: "Strategic Partner",
  community_partner: "Community Partner",
};

const partners: EcosystemPartner[] = [
  {
    slug: "trezor-academy",
    name: "Trezor Academy",
    tagline: "Supporting the next generation of open source builders.",
    description:
      "Trezor Academy is a Pull Founding Sponsor, supporting the platform during its first year as Pull builds the infrastructure for developers to learn, build, contribute, and prove their work.",
    website: "https://academy.trezor.io/",
    logoInitials: "TA",
    logoSrc: "/trezor-academy-logo.svg",
    partnerType: "founding_sponsor",
    recognitionLabel: "Pull Founding Sponsor",
    partnershipStartYear: 2026,
  },
  {
    slug: "the-buidl",
    name: "The Buidl",
    tagline: "Training the next generation of Bitcoin and Lightning developers.",
    description:
      "The Buidl is a developer program focused on hands-on Bitcoin and Lightning Network development. Graduates join Pull to continue their open source contribution journey.",
    website: "https://thebuidl.xyz",
    logoInitials: "TB",
    logoSrc: "/buidl-logo.svg",
    logoLight: true,
    partnerType: "learning_partner",
    journeys: [
      {
        slug: "rust-for-bitcoin",
        name: "Rust for Bitcoin",
        status: "active",
        summary:
          "A contribution journey for qualified The Buidl participants. Learn practical Rust and Bitcoin development skills with The Buidl. Continue by applying those skills to real open source projects on Pull.",
        skills: ["Rust", "Bitcoin", "Open Source"],
      },
    ],
  },
];

const bySlug = new Map(partners.map((p) => [p.slug, p]));

export function listPartners(): EcosystemPartner[] {
  return [...partners];
}

export function getPartnerBySlug(slug: string): EcosystemPartner | null {
  return bySlug.get(slug) ?? null;
}

export function listPartnerSlugs(): string[] {
  return partners.map((p) => p.slug);
}
