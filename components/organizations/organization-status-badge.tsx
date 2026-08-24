import { Badge } from "@/components/ui/badge";
import type { OrganizationProfile } from "@/lib/organizations/types";
import { cn } from "@/lib/utils";

type OrganizationStatusBadgeProps = {
  claimed: boolean;
  className?: string;
};

/** Status chip for unclaimed community-maintained directory profiles. */
export function OrganizationStatusBadge({
  claimed,
  className,
}: OrganizationStatusBadgeProps) {
  if (claimed) {
    return (
      <Badge className={cn("border-ink/20 bg-signal/40 text-ink", className)}>
        Claimed Profile
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-ink/20 bg-background text-foreground", className)}
    >
      <span
        className="size-2 shrink-0 rounded-full bg-[oklch(0.84_0.16_95)]"
        aria-hidden
      />
      Community Profile
    </Badge>
  );
}

export function organizationStatusLabel(
  organization: Pick<OrganizationProfile, "claimed">,
): string {
  return organization.claimed ? "Claimed Profile" : "Community Profile";
}
