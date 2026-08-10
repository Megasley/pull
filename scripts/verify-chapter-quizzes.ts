import bitcoinRoadmap from "@/content/roadmaps/bitcoin.json";
import lightningRoadmap from "@/content/roadmaps/lightning.json";
import bitcoinQuizzes from "@/content/quizzes/bitcoin.json";
import lightningQuizzes from "@/content/quizzes/lightning.json";
import type { LessonChapterQuiz } from "@/types/content";
import type { RoadmapJson } from "@/types/roadmap";

type QuizCatalog = {
  slug: string;
  roadmap: RoadmapJson;
  quizzes: LessonChapterQuiz[];
  minQuestions: number;
  maxQuestions: number;
};

const catalogs: QuizCatalog[] = [
  {
    slug: "bitcoin",
    roadmap: bitcoinRoadmap as RoadmapJson,
    quizzes: bitcoinQuizzes as LessonChapterQuiz[],
    minQuestions: 5,
    maxQuestions: 5,
  },
  {
    slug: "lightning",
    roadmap: lightningRoadmap as RoadmapJson,
    quizzes: lightningQuizzes as LessonChapterQuiz[],
    minQuestions: 3,
    maxQuestions: 4,
  },
];

const errors: string[] = [];

for (const { slug, roadmap, quizzes, minQuestions, maxQuestions } of catalogs) {
  for (const section of roadmap.sections) {
    const quiz = quizzes.find((item) => item.sectionId === section.id);
    if (!quiz) {
      errors.push(`[${slug}] Missing quiz for section: ${section.id}`);
      continue;
    }

    if (quiz.id !== `${slug}:${section.id}`) {
      errors.push(
        `[${slug}] Quiz id mismatch for ${section.id}: expected ${slug}:${section.id}`,
      );
    }

    if (quiz.questions.length < minQuestions || quiz.questions.length > maxQuestions) {
      errors.push(
        `[${slug}] ${quiz.id}: expected ${minQuestions}-${maxQuestions} questions, found ${quiz.questions.length}`,
      );
    }

    if (quiz.passingScore > quiz.questions.length) {
      errors.push(`[${slug}] ${quiz.id}: passingScore exceeds question count`);
    }

    for (const question of quiz.questions) {
      const optionIds = new Set(question.options.map((option) => option.id));
      if (!optionIds.has(question.correctOptionId)) {
        errors.push(
          `[${slug}] ${quiz.id}/${question.id}: correctOptionId "${question.correctOptionId}" not in options`,
        );
      }
    }

    const checkpoint = roadmap.nodes.find(
      (node) => node.sectionId === section.id && node.chapterCheckpoint === true,
    );

    if (!checkpoint) {
      errors.push(
        `[${slug}] Missing chapterCheckpoint node for section: ${section.id}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Chapter quiz verification failed:\n");
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

const totalSections = catalogs.reduce(
  (sum, catalog) => sum + catalog.quizzes.length,
  0,
);
console.log(
  `Chapter quiz verification passed (${totalSections} sections across ${catalogs.length} roadmaps).`,
);
