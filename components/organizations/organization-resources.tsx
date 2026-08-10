import { ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { OrganizationSection } from "@/components/organizations/organization-section";
import { Badge } from "@/components/ui/badge";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationResourcesProps = {
  organization: OrganizationProfile;
};

export function OrganizationResources({
  organization,
}: OrganizationResourcesProps) {
  return (
    <OrganizationSection
      id="learn"
      eyebrow="learn // resources"
      title="Learning resources"
      description="Docs, guides, and references to ramp up before opening a PR."
    >
      {organization.resources.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="Learning materials will show up here once published."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organization.resources.map((resource) => (
            <li key={resource.id}>
              <a
                href={resource.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col border border-border bg-background p-4 transition-colors hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="outline">{resource.type}</Badge>
                  <ArrowUpRight
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <h3 className="mt-3 text-sm font-semibold tracking-tight">
                  {resource.title}
                </h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                  {resource.description}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </OrganizationSection>
  );
}
