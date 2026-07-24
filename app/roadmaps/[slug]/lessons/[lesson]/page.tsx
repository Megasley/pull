import { notFound } from "next/navigation";

import { LessonRenderer } from "@/components/content/lesson-renderer";
import {
  getAllLessonSlugs,
  getLessonNavigation,
  loadLessonSource,
} from "@/lib/content";
import { getRoadmapSlugs } from "@/lib/roadmap/load-roadmap";
import { siteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/supabase/env";

type LessonPageProps = {
  params: Promise<{ slug: string; lesson: string }>;
};

export async function generateStaticParams() {
  return getAllLessonSlugs().map(({ roadmap, lesson }) => ({
    slug: roadmap,
    lesson,
  }));
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { slug, lesson } = await params;
  const lessonData = loadLessonSource(slug, lesson);

  if (!lessonData) {
    return { title: "Lesson not found" };
  }

  const base = getSiteUrl() || siteConfig.url;
  const path = `/roadmaps/${slug}/lessons/${lesson}`;
  const title = `${lessonData.title} · ${slug} roadmap`;
  const description = lessonData.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${base}${path}`,
      siteName: siteConfig.name,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${base}${path}`,
    },
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lesson } = await params;

  if (!getRoadmapSlugs().includes(slug)) {
    notFound();
  }

  const lessonData = loadLessonSource(slug, lesson);

  if (!lessonData) {
    notFound();
  }

  const navigation = getLessonNavigation(slug, lesson);

  return <LessonRenderer lesson={lessonData} navigation={navigation} />;
}
