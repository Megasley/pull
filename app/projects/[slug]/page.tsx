import { notFound } from "next/navigation";

import { ProjectDetails } from "@/components/projects/project-details";
import { getAllProjects } from "@/lib/projects/catalog";
import { loadProjectSpec } from "@/lib/projects/load-spec";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = loadProjectSpec(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.title,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = loadProjectSpec(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetails project={project} />;
}
