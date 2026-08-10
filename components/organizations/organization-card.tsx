import Link from "next/link";

import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Button } from "@/components/ui/button";
import type { OrganizationDirectoryCard } from "@/lib/organizations/catalog";

type OrganizationDirectoryCardProps = {
  organization: OrganizationDirectoryCard;
};

export function OrganizationCard({
  organization,
}: OrganizationDirectoryCardProps) {
  return (
    <article className="flex h-full flex-col border border-border bg-background p-4 transition-colors hover:bg-muted/20">
      <div className="flex items-start gap-3">
        <div
          className="flex size-12 shrink-0 items-center justify-center border border-ink bg-signal font-mono text-xs font-bold text-ink"
          aria-hidden
        >
          {organization.logoInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold tracking-tight">
              {organization.name}
            </h2>
            <OrganizationStatusBadge claimed={organization.claimed} />
          </div>
          <p className="mt-2 line-clamp-3 font-mono text-xs leading-relaxed text-muted-foreground">
            {organization.tagline}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="border border-border px-2 py-1.5">
          <dt className="text-muted-foreground uppercase tracking-wide">
            Projects
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-foreground">
            {organization.projectCount}
          </dd>
        </div>
        <div className="border border-border px-2 py-1.5">
          <dt className="text-muted-foreground uppercase tracking-wide">
            Opportunities
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-foreground">
            {organization.opportunityCount}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/organizations/${organization.slug}`}>View Profile</Link>
        </Button>
      </div>
    </article>
  );
}
