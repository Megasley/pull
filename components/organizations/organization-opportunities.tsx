import { ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { OrganizationSection } from "@/components/organizations/organization-section";
import { Badge } from "@/components/ui/badge";
import type {
  OrganizationOpportunity,
  OrganizationProfile,
} from "@/lib/organizations/types";

const kindLabel: Record<OrganizationOpportunity["kind"], string> = {
  role: "Open role",
  grant: "Grant",
  bounty: "Bounty",
  research: "Research",
};

const statusLabel: Record<OrganizationOpportunity["status"], string> = {
  open: "Open",
  rolling: "Rolling",
  upcoming: "Upcoming",
};

type OrganizationOpportunitiesProps = {
  organization: OrganizationProfile;
};

export function OrganizationOpportunities({
  organization,
}: OrganizationOpportunitiesProps) {
  return (
    <OrganizationSection
      id="opportunities"
      eyebrow="grow // opportunities"
      title="Opportunities"
      description="Roles, grants, bounties, and research tracks for builders ready to go deeper."
    >
      {organization.opportunities.length === 0 ? (
        <EmptyState
          title="No open opportunities"
          description="Check community channels for the latest calls."
          actionLabel="Join community"
          actionHref={organization.communityInvite}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {organization.opportunities.map((item) => {
            const body = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-ink/20 bg-signal/30 text-ink">
                    {kindLabel[item.kind]}
                  </Badge>
                  <Badge variant="outline">{statusLabel[item.status]}</Badge>
                  {item.href ? (
                    <ArrowUpRight
                      className="ml-auto size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <h3 className="mt-3 text-sm font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-full border border-border bg-background p-4 transition-colors hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {body}
                  </a>
                ) : (
                  <div className="h-full border border-border bg-background p-4">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </OrganizationSection>
  );
}
