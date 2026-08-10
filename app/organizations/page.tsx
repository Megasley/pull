import { PageHeader } from "@/components/design-system";
import { OrganizationsDirectory } from "@/components/organizations/organizations-directory";
import { SiteContainer } from "@/components/layout/site-container";
import { listOrganizationDirectoryCards } from "@/lib/organizations/catalog";

export const metadata = {
  title: "Organizations",
  description:
    "Browse community-maintained organization profiles on Pull — discover projects, learning resources, and contribution opportunities across Bitcoin and Lightning ecosystems.",
};

export default function OrganizationsPage() {
  const organizations = listOrganizationDirectoryCards();

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="contribute // organizations"
        title="Organizations"
        description="Community-maintained profiles that help developers discover ecosystems, contributor journeys, and open opportunities on Pull. Organizations can claim a profile to manage content and update contributor resources."
        meta={
          organizations.length === 0
            ? "profiles // 0"
            : `profiles // ${organizations.length}`
        }
      />

      <div className="mt-10">
        <OrganizationsDirectory organizations={organizations} />
      </div>
    </SiteContainer>
  );
}
