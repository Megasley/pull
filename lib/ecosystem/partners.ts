export type PartnerType =
  | "founding_sponsor"
  | "ecosystem_sponsor"
  | "learning_partner"
  | "project_partner"
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
  /** Human-readable recognition label, e.g. "Founding Sponsor". */
  recognitionLabel?: string;
  /** Year the partnership began. */
  partnershipStartYear?: number;
  /** Extra sentence shown only in the featured (highest-tier) partner card. */
  supportingText?: string;
  /** Short "learn → contribute → prove" steps shown inside a partner's card. */
  journeySteps?: string[];
  /** Active pathways/cohorts whose graduates continue on Pull. */
  journeys?: PartnerJourney[];
  /** Set true while a partnership is still being finalized — excluded from
   *  listPartners()/listPartnerSlugs() (so the ecosystem index and the
   *  generic [slug] route never surface it), and its dedicated page (if any)
   *  should call notFound() when this is true. getPartnerBySlug() still
   *  returns it — this hides the partner from discovery, not from admins
   *  who have the data. */
  hidden?: boolean;
};

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  founding_sponsor: "Founding Sponsor",
  ecosystem_sponsor: "Ecosystem Partner",
  learning_partner: "Learning Partner",
  project_partner: "Project Partner",
  strategic_partner: "Strategic Partner",
  community_partner: "Community Partner",
};

/** Plural section labels, in display order, for grouping partners by category. */
const PARTNER_CATEGORY_LABELS: Record<PartnerType, string> = {
  founding_sponsor: "Founding Sponsors",
  ecosystem_sponsor: "Ecosystem Partners",
  learning_partner: "Learning Partners",
  project_partner: "Project Partners",
  strategic_partner: "Strategic Partners",
  community_partner: "Community Partners",
};

const PARTNER_CATEGORY_ORDER: PartnerType[] = [
  "founding_sponsor",
  "ecosystem_sponsor",
  "learning_partner",
  "project_partner",
  "strategic_partner",
  "community_partner",
];

export type PartnerCategoryGroup = {
  type: PartnerType;
  label: string;
  partners: EcosystemPartner[];
};

/** Groups partners by type in a stable display order, dropping empty categories. */
export function groupPartnersByCategory(list: EcosystemPartner[]): PartnerCategoryGroup[] {
  return PARTNER_CATEGORY_ORDER.map((type) => ({
    type,
    label: PARTNER_CATEGORY_LABELS[type],
    partners: list.filter((partner) => partner.partnerType === type),
  })).filter((group) => group.partners.length > 0);
}

const partners: EcosystemPartner[] = [
  {
    slug: "trezor-academy",
    name: "Trezor Academy",
    // Launching with Thebuidl first — Trezor Academy stays hidden from the
    // ecosystem index, the trusted-by marquee, and its own page until the
    // partnership is finalized. Flip this to unhide.
    hidden: true,
    tagline: "Supporting the next generation of open source builders.",
    description:
      "Trezor Academy is a Pull Founding Sponsor, supporting the platform during its first year as Pull builds the infrastructure for developers to learn, build, contribute, and prove their work.",
    website: "https://academy.trezor.io/",
    logoInitials: "TA",
    logoSrc: "/trezor-academy-logo.svg",
    partnerType: "founding_sponsor",
    recognitionLabel: "Founding Sponsor",
    partnershipStartYear: 2026,
    supportingText:
      "Helping Pull create more opportunities for developers to learn, build, contribute, and develop real open source experience.",
  },
  {
    slug: "the-buidl",
    name: "Thebuidl",
    tagline: "Training the next generation of Bitcoin and Lightning developers.",
    description:
      "Thebuidl is a developer program focused on hands-on Bitcoin and Lightning Network development. Graduates join Pull to continue their open source contribution journey.",
    website: "https://thebuidl.xyz",
    logoInitials: "TB",
    logoSrc: "/buidl-logo.svg",
    logoLight: true,
    partnerType: "learning_partner",
    journeySteps: [
      "Learn with Thebuidl",
      "Find real contribution opportunities on Pull",
      "Build a public record of your work",
    ],
    journeys: [
      {
        slug: "rust-for-bitcoin",
        name: "Rust for Bitcoin",
        status: "active",
        summary:
          "A contribution journey for qualified Thebuidl participants. Learn practical Rust and Bitcoin development skills with Thebuidl. Continue by applying those skills to real open source projects on Pull.",
        skills: ["Rust", "Bitcoin", "Open Source"],
      },
    ],
  },
];

const bySlug = new Map(partners.map((p) => [p.slug, p]));

/** Excludes hidden partners — for the ecosystem index, trusted-by marquee, etc. */
export function listPartners(): EcosystemPartner[] {
  return partners.filter((p) => !p.hidden);
}

/** Unfiltered — returns a hidden partner's data too, for its own dedicated
 *  page to check `.hidden` and call notFound() itself. */
export function getPartnerBySlug(slug: string): EcosystemPartner | null {
  return bySlug.get(slug) ?? null;
}

/** Excludes hidden partners — used by the generic [slug] route's generateStaticParams. */
export function listPartnerSlugs(): string[] {
  return partners.filter((p) => !p.hidden).map((p) => p.slug);
}
