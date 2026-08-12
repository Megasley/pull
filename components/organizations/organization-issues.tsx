import { ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import {
  difficultyClassName,
  difficultyLabel,
  OrganizationSection,
} from "@/components/organizations/organization-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationIssuesProps = {
  organization: OrganizationProfile;
};

export function OrganizationIssues({ organization }: OrganizationIssuesProps) {
  return (
    <OrganizationSection
      id="issues"
      eyebrow="contribute // issues"
      title="Good first issues"
      description={`Starter and mid-level issues curated for builders approaching ${organization.name}.`}
    >
      {organization.issues.length === 0 ? (
        <EmptyState
          title="No issues listed yet"
          description="Check back soon, or browse the organization on GitHub."
          actionLabel="View GitHub"
          actionHref={organization.github}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {organization.issues.map((issue) => (
            <li
              key={issue.id}
              className="flex h-full flex-col border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={difficultyClassName[issue.difficulty]}>
                  {difficultyLabel[issue.difficulty]}
                </Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {issue.repository}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold tracking-tight text-balance">
                {issue.title}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={issue.href} target="_blank" rel="noreferrer">
                    View Issue
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </OrganizationSection>
  );
}
