import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { Muted } from "@/components/design-system";
import { ProjectBookmarkButton } from "@/components/projects/project-bookmark-button";
import {
  ProjectBulletList,
  ProjectDetailsToc,
  ProjectExampleRepoList,
  ProjectResourceList,
  ProjectSection,
} from "@/components/projects/project-detail-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compileProjectMdx } from "@/lib/projects/compile-spec";
import type { ProjectSpec } from "@/types/project";
import type { RoadmapDifficulty } from "@/types";

import "@/styles/mdx.css";

const difficultyLabels: Record<RoadmapDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const difficultyClass: Record<RoadmapDifficulty, string> = {
  beginner: "border-ink/20 bg-signal text-ink",
  intermediate: "border-ink/30 bg-ink/10 text-ink",
  advanced: "border-ink bg-ink text-[var(--background)]",
};

const TOC_SECTIONS = [
  { id: "overview", title: "Overview" },
  { id: "objectives", title: "Learning objectives" },
  { id: "prerequisites", title: "Prerequisites" },
  { id: "architecture", title: "Architecture" },
  { id: "requirements", title: "Requirements" },
  { id: "stretch-goals", title: "Stretch goals" },
  { id: "resources", title: "Recommended resources" },
  { id: "examples", title: "Example repositories" },
  { id: "submission", title: "Submission instructions" },
] as const;

type ProjectDetailsProps = {
  project: ProjectSpec;
};

export async function ProjectDetails({ project }: ProjectDetailsProps) {
  const { content: overviewContent } = await compileProjectMdx(project.overview);
  const lessonHref = `/roadmaps/${project.roadmapSlug}/lessons/${project.lessonSlug}`;
  const roadmapHref = `/roadmaps/${project.roadmapSlug}`;

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-8">
          <Link href="/projects">
            <ArrowLeft aria-hidden />
            ls ./projects
          </Link>
        </Button>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <p className="tech-eyebrow">
              project // {project.categories.join(" · ")}
            </p>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em]">
              {project.title}
            </h1>
            <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
              {project.description}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={`rounded-none font-mono text-[11px] tracking-[0.12em] uppercase ${difficultyClass[project.difficulty]}`}
                >
                  {difficultyLabels[project.difficulty]}
                </Badge>
                <Badge variant="outline" className="gap-1 font-mono text-[11px]">
                  <Clock className="size-3" aria-hidden />
                  {project.estimatedTime}
                </Badge>
              </div>
              <ProjectBookmarkButton
                slug={project.slug}
                className="w-full sm:ml-auto sm:w-auto"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/projects/${project.slug}/submit`}>
                  ./submit
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={lessonHref}>./open-lesson</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={roadmapHref}>ls ./roadmap</Link>
              </Button>
            </div>

            <div className="mt-8 lg:hidden">
              <ProjectDetailsToc sections={[...TOC_SECTIONS]} />
            </div>

            <div className="mt-10 space-y-4">
              <ProjectSection id="overview" title="Overview">
                <div className="mdx-content prose-project overflow-x-auto">
                  {overviewContent}
                </div>
              </ProjectSection>

              <ProjectSection id="objectives" title="Learning objectives">
                <ProjectBulletList items={project.objectives} />
              </ProjectSection>

              <ProjectSection id="prerequisites" title="Prerequisites">
                <ProjectBulletList items={project.prerequisites} />
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Required skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-none border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <Muted className="text-xs">
                  Part of the{" "}
                  <Link
                    href={roadmapHref}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    {project.roadmapSlug} roadmap
                  </Link>
                  .
                </Muted>
              </ProjectSection>

              <ProjectSection id="architecture" title="Architecture diagram">
                <pre className="overflow-x-auto rounded-none border border-border bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-[#e6edf3] sm:text-sm">
                  {project.architecture.trim()}
                </pre>
              </ProjectSection>

              <ProjectSection id="requirements" title="Requirements">
                <ProjectBulletList items={project.requirements} />
              </ProjectSection>

              <ProjectSection id="stretch-goals" title="Stretch goals">
                <ProjectBulletList items={project.stretchGoals} />
              </ProjectSection>

              <ProjectSection id="resources" title="Recommended resources">
                <ProjectResourceList resources={project.resources} />
              </ProjectSection>

              <ProjectSection id="examples" title="Example repositories">
                <ProjectExampleRepoList repos={project.exampleRepos} />
              </ProjectSection>

              <ProjectSection id="submission" title="Submission instructions">
                <ProjectBulletList items={project.submission} />
              </ProjectSection>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <ProjectDetailsToc sections={[...TOC_SECTIONS]} />
              <div className="rounded-none border border-border bg-card p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Estimated time
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {project.estimatedTime}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Bookmark this project to find it quickly later. When you are
                  ready, submit your repository from the submit page.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
