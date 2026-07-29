import { renderOgCard } from "@/lib/og/card";
import { availableRoadmaps } from "@/lib/landing-data";
import { getRoadmap } from "@/lib/roadmap/load-roadmap";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgProps = {
  params: Promise<{ slug: string }>;
};

export default async function OpenGraphImage({ params }: OgProps) {
  const { slug } = await params;
  const roadmap =
    getRoadmap(slug) ?? availableRoadmaps.find((item) => item.slug === slug);

  const title = roadmap?.title ?? slug;
  const description =
    roadmap && "description" in roadmap ? roadmap.description : "Builder roadmap on Pull.";
  const lessonCount = roadmap && "nodes" in roadmap ? roadmap.nodes.length : 0;

  return renderOgCard({
    eyebrow: "roadmap",
    title,
    subtitle: description,
    footer: lessonCount > 0 ? `${lessonCount} lessons` : "pullos.dev",
    meta: `pullos.dev/roadmaps/${slug}`,
  });
}
