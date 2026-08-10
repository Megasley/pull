import { compileLessonMdx } from "@/lib/content/compile-mdx";
import { getRoadmap } from "@/lib/roadmap/load-roadmap";
import type { CompiledLesson, LessonNavigation } from "@/types/content";

import { LessonExperience } from "./lesson-experience";

import "@/styles/mdx.css";
import "@/styles/lesson.css";

type LessonRendererProps = {
  lesson: CompiledLesson;
  navigation: LessonNavigation;
};

export async function LessonRenderer({ lesson, navigation }: LessonRendererProps) {
  const roadmap = getRoadmap(lesson.roadmap);

  if (!roadmap) {
    throw new Error(`Roadmap "${lesson.roadmap}" not found.`);
  }

  const { content } = await compileLessonMdx(lesson.body);

  return (
    <LessonExperience lesson={lesson} navigation={navigation} roadmap={roadmap}>
      {content}
    </LessonExperience>
  );
}
