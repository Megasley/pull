import { ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import { OrganizationSection } from "@/components/organizations/organization-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationMaintainersProps = {
  organization: OrganizationProfile;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OrganizationMaintainers({
  organization,
}: OrganizationMaintainersProps) {
  return (
    <OrganizationSection
      id="maintainers"
      eyebrow="team // maintainers"
      title="Maintainers"
      description="People guiding reviews, mentorship, and roadmap direction."
    >
      {organization.maintainers.length === 0 ? (
        <EmptyState
          title="No maintainers listed"
          description="Maintainer profiles will appear here when available."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {organization.maintainers.map((person) => {
            const githubUrl = `https://github.com/${person.githubUsername}`;
            return (
              <li
                key={person.id}
                className="flex h-full flex-col border border-border bg-background p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 rounded-none border border-border">
                    {person.avatarUrl ? (
                      <AvatarImage src={person.avatarUrl} alt={person.name} />
                    ) : null}
                    <AvatarFallback className="rounded-none bg-signal/20 font-mono text-xs">
                      {initials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold tracking-tight">
                      {person.name}
                    </h3>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {person.role}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={githubUrl} target="_blank" rel="noreferrer">
                      @{person.githubUsername}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </OrganizationSection>
  );
}
