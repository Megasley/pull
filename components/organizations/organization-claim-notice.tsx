import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationClaimNoticeProps = {
  organization: OrganizationProfile;
};

export function OrganizationClaimNotice({
  organization,
}: OrganizationClaimNoticeProps) {
  if (organization.claimed) return null;

  return (
    <p className="max-w-3xl border-l-2 border-ink/20 pl-3 font-mono text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
      {organization.claimNotice}
    </p>
  );
}
