import { ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { OrganizationSection } from "@/components/organizations/organization-section";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationCommunityProps = {
  organization: OrganizationProfile;
};

export function OrganizationCommunity({
  organization,
}: OrganizationCommunityProps) {
  return (
    <OrganizationSection
      id="community"
      eyebrow="community // channels"
      title="Community"
      description={`Meet ${organization.name} maintainers and fellow contributors.`}
    >
      {organization.community.length === 0 ? (
        <EmptyState
          title="No community links"
          description="Community channels will appear here when published."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {organization.community.map((channel) => (
            <li key={channel.id}>
              <a
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col border border-border bg-background p-4 transition-colors hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">
                    {channel.name}
                  </h3>
                  <ArrowUpRight
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </OrganizationSection>
  );
}
