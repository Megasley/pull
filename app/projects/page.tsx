import { PageHeader } from "@/components/design-system";
import { SiteContainer } from "@/components/layout/site-container";
import { ProjectLibrary } from "@/components/projects/project-library";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getAllProjects } from "@/lib/projects/catalog";
import { listUserSubmissionStatusByProjectSlug } from "@/lib/submissions/repository";

export const metadata = {
  title: "Build Projects",
  description:
    "Hands-on Bitcoin and Lightning builds from beginner labs to advanced protocol tooling.",
};

export default async function ProjectsPage() {
  const projects = getAllProjects();
  const beginner = projects.filter((p) => p.difficulty === "beginner").length;
  const intermediate = projects.filter((p) => p.difficulty === "intermediate").length;
  const advanced = projects.filter((p) => p.difficulty === "advanced").length;

  const profile = await bootstrapCurrentUserProfile();
  const submissionStatusBySlug =
    profile && isDatabaseConfigured()
      ? await listUserSubmissionStatusByProjectSlug(profile.id)
      : {};

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="build // projects"
        title="Build Projects"
        description="Guided projects builders complete while progressing through roadmaps — concrete builds with clear ship criteria, not generic todos. Filter by track and difficulty, then open a project for architecture, requirements, and submission notes."
        meta={`entries // ${projects.length} · beginner ${beginner} · intermediate ${intermediate} · advanced ${advanced}`}
      />

      <div className="mt-10">
        <ProjectLibrary
          projects={projects}
          submissionStatusBySlug={submissionStatusBySlug}
        />
      </div>
    </SiteContainer>
  );
}
