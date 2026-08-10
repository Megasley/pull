import Link from "next/link";
import { ExternalLink, GitBranch } from "lucide-react";

import { OrganizationClaimButton } from "@/components/organizations/organization-claim-button";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Button } from "@/components/ui/button";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationHeroProps = {
  organization: OrganizationProfile;
};

export function OrganizationHero({ organization }: OrganizationHeroProps) {
  return (
    <header className="flex flex-col gap-8 border-b border-border pb-10">
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
        <div
          className="flex size-20 shrink-0 items-center justify-center border-2 border-ink bg-signal font-mono text-xl font-bold tracking-tight text-ink sm:size-24 sm:text-2xl"
          aria-hidden
        >
          {organization.logoInitials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="tech-eyebrow">organizations // directory</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-bold tracking-[-0.04em]">
              {organization.name}
            </h1>
            <OrganizationStatusBadge claimed={organization.claimed} />
          </div>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            {organization.tagline}
          </p>
          <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Last Updated: {organization.lastUpdated}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {!organization.claimed ? (
              <OrganizationClaimButton organizationName={organization.name} />
            ) : null}
            <Button asChild variant={!organization.claimed ? "outline" : "default"}>
              <a href={organization.website} target="_blank" rel="noreferrer">
                Visit Website
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={organization.github} target="_blank" rel="noreferrer">
                <GitBranch className="size-3.5" aria-hidden />
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={organization.communityInvite}
                target="_blank"
                rel="noreferrer"
              >
                Join Community
              </a>
            </Button>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {organization.stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border bg-background px-3 py-3 sm:px-4"
          >
            <dt className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              {stat.label}
            </dt>
            <dd className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

export function OrganizationPageNav() {
  return (
    <nav
      aria-label="On this page"
      className="flex flex-wrap gap-2 font-mono text-[11px] tracking-wide uppercase"
    >
      {[
        ["about", "About"],
        ["journey", "Journey"],
        ["issues", "Issues"],
        ["projects", "Projects"],
        ["learn", "Learn"],
        ["opportunities", "Opportunities"],
        ["community", "Community"],
        ["maintainers", "Maintainers"],
      ].map(([href, label]) => (
        <Link
          key={href}
          href={`#${href}`}
          className="border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-ink hover:text-foreground"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
