import { OrganizationAbout } from "@/components/organizations/organization-about";
import { OrganizationClaimNotice } from "@/components/organizations/organization-claim-notice";
import { OrganizationCommunity } from "@/components/organizations/organization-community";
import { OrganizationCommunityBanner } from "@/components/organizations/organization-community-banner";
import {
  OrganizationHero,
  OrganizationPageNav,
} from "@/components/organizations/organization-hero";
import { OrganizationIssues } from "@/components/organizations/organization-issues";
import { OrganizationJourney } from "@/components/organizations/organization-journey";
import { OrganizationMaintainers } from "@/components/organizations/organization-maintainers";
import { OrganizationOpportunities } from "@/components/organizations/organization-opportunities";
import { OrganizationProjects } from "@/components/organizations/organization-projects";
import { OrganizationResources } from "@/components/organizations/organization-resources";
import { SiteContainer } from "@/components/layout/site-container";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationProfileViewProps = {
  organization: OrganizationProfile;
};

export function OrganizationProfileView({
  organization,
}: OrganizationProfileViewProps) {
  return (
    <SiteContainer className="pt-10 pb-20 sm:pt-12">
      <div className="space-y-10">
        <OrganizationCommunityBanner organization={organization} />
        <div className="space-y-6">
          <OrganizationHero organization={organization} />
          <OrganizationClaimNotice organization={organization} />
          <OrganizationPageNav />
        </div>
        <OrganizationAbout organization={organization} />
        <OrganizationJourney organization={organization} />
        <OrganizationIssues organization={organization} />
        <OrganizationProjects organization={organization} />
        <OrganizationResources organization={organization} />
        <OrganizationOpportunities organization={organization} />
        <OrganizationCommunity organization={organization} />
        <OrganizationMaintainers organization={organization} />
      </div>
    </SiteContainer>
  );
}
