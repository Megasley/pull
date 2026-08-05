import { fedimintOrganization } from "@/lib/organizations/data/fedimint";
import type { OrganizationProfile } from "@/lib/organizations/types";

const organizations: OrganizationProfile[] = [fedimintOrganization];

const bySlug = new Map(
  organizations.map((organization) => [organization.slug, organization]),
);

export type OrganizationDirectoryCard = {
  slug: string;
  name: string;
  tagline: string;
  logoInitials: string;
  claimed: boolean;
  projectCount: number;
  opportunityCount: number;
};

export function listOrganizationSlugs(): string[] {
  return organizations.map((organization) => organization.slug);
}

export function getOrganizationBySlug(
  slug: string,
): OrganizationProfile | null {
  return bySlug.get(slug) ?? null;
}

export function listOrganizations(): OrganizationProfile[] {
  return [...organizations];
}

export function listOrganizationDirectoryCards(): OrganizationDirectoryCard[] {
  return organizations.map((organization) => ({
    slug: organization.slug,
    name: organization.name,
    tagline: organization.tagline,
    logoInitials: organization.logoInitials,
    claimed: organization.claimed,
    projectCount: organization.projects.length,
    opportunityCount: organization.opportunities.length,
  }));
}
