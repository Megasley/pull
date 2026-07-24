import { PageHeader } from "@/components/design-system";
import { ProjectLibrary } from "@/components/projects/project-library";
import { getAllProjects } from "@/lib/projects/catalog";

export const metadata = {
  title: "Projects",
  description:
    "Hands-on Bitcoin and Lightning builds from beginner labs to advanced protocol tooling.",
};

export default function ProjectsPage() {
  const projects = getAllProjects();
  const beginner = projects.filter((p) => p.difficulty === "beginner").length;
  const intermediate = projects.filter((p) => p.difficulty === "intermediate").length;
  const advanced = projects.filter((p) => p.difficulty === "advanced").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="catalog // projects"
        title="Project library"
        description="Concrete builds with clear ship criteria - not generic todos. Filter by track and difficulty, then open a project for architecture, requirements, and submission notes."
        meta={`entries // ${projects.length} · beginner ${beginner} · intermediate ${intermediate} · advanced ${advanced}`}
      />

      <div className="mt-10">
        <ProjectLibrary projects={projects} />
      </div>
    </div>
  );
}
