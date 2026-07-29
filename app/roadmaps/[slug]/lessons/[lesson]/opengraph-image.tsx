import { renderOgCard } from "@/lib/og/card";
import { loadLessonSource } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgProps = {
  params: Promise<{ slug: string; lesson: string }>;
};

export default async function OpenGraphImage({ params }: OgProps) {
  const { slug, lesson } = await params;
  const lessonData = loadLessonSource(slug, lesson);

  return renderOgCard({
    eyebrow: `${slug} lesson`,
    title: lessonData?.title ?? lesson,
    subtitle: lessonData?.description ?? "Lesson on Pull.",
    footer: lessonData?.duration ? `Duration ${lessonData.duration}` : undefined,
    meta: `pullos.dev`,
  });
}
