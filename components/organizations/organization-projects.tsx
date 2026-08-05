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

type OrganizationProjectsProps = {
  organization: OrganizationProfile;
};

export function OrganizationProjects({
  organization,
}: OrganizationProjectsProps) {
  return (
    <OrganizationSection
      id="projects"
      eyebrow="build // projects"
      title="Featured projects"
      description={`Repositories and surfaces where ${organization.name} needs contributors most.`}
    >
      {organization.projects.length === 0 ? (
        <EmptyState
          title="No projects listed"
          description="Projects will appear here as the organization publishes contribution surfaces."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organization.projects.map((project) => (
            <li
              key={project.id}
              className="flex h-full flex-col border border-border bg-background p-4"
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{project.language}</Badge>
                <Badge className={difficultyClassName[project.contributionLevel]}>
                  {difficultyLabel[project.contributionLevel]}
                </Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold tracking-tight">
                {project.name}
              </h3>
              <p className="mt-2 flex-1 font-mono text-xs leading-relaxed text-muted-foreground">
                {project.description}
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={project.href} target="_blank" rel="noreferrer">
                    GitHub
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
