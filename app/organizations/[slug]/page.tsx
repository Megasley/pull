import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrganizationProfileView } from "@/components/organizations/organization-profile";
import { getOrganizationBySlug, listOrganizationSlugs } from "@/lib/organizations";
import { siteConfig } from "@/lib/site-config";

type OrganizationPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listOrganizationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: OrganizationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organization = getOrganizationBySlug(slug);
  if (!organization) {
    return { title: "Organization" };
  }

  const title = `${organization.name} · Organization`;
  const description = organization.tagline;

  return {
    title,
    description,
    alternates: {
      canonical: `/organizations/${organization.slug}`,
    },
    openGraph: {
      title: `${organization.name} on ${siteConfig.name}`,
      description,
      url: `/organizations/${organization.slug}`,
      type: "website",
    },
  };
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { slug } = await params;
  const organization = getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  return <OrganizationProfileView organization={organization} />;
}
