import { siteConfig } from "@/lib/site-config";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationCommunityBannerProps = {
  organization: OrganizationProfile;
};

export function OrganizationCommunityBanner({
  organization,
}: OrganizationCommunityBannerProps) {
  return (
    <aside
      className="border border-border bg-muted/40 px-4 py-3 sm:px-5"
      aria-label="Community organization profile"
    >
      <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-foreground uppercase">
        Community Organization Profile
      </p>
      <p className="mt-1.5 max-w-3xl font-mono text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
        {organization.communityNotice}
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground sm:text-[13px]">
        Interested in claiming this profile?{" "}
        <a
          href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`Claim organization: ${organization.name}`)}`}
          className="text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground"
        >
          Contact the Pull team
        </a>
        .
      </p>
    </aside>
  );
}
