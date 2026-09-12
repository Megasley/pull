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
  const sectionIds = new Set<string>();
  const quizzesBySection = new Map<string, LessonChapterQuiz[]>();
  const checkpointsBySection = new Map<string, RoadmapJson["nodes"]>();
  const seenQuizIds = new Set<string>();
  const seenCheckpointIds = new Set<string>();

  for (const section of roadmap.sections) {
    if (sectionIds.has(section.id)) {
      errors.push(`[${slug}] Duplicate section id: ${section.id}`);
    }
    sectionIds.add(section.id);
  }

  for (const quiz of quizzes) {
    if (seenQuizIds.has(quiz.id)) {
      errors.push(`[${slug}] Duplicate quiz id: ${quiz.id}`);
    }
    seenQuizIds.add(quiz.id);

    const sectionQuizzes = quizzesBySection.get(quiz.sectionId) ?? [];
    sectionQuizzes.push(quiz);
    quizzesBySection.set(quiz.sectionId, sectionQuizzes);

    if (!sectionIds.has(quiz.sectionId)) {
      errors.push(
        `[${slug}] Quiz ${quiz.id} references unknown section: ${quiz.sectionId}`,
      );
    }

    if (quiz.id !== `${slug}:${quiz.sectionId}`) {
      errors.push(
        `[${slug}] Quiz id mismatch for ${quiz.sectionId}: expected ${slug}:${quiz.sectionId}`,
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
  }

  for (const checkpoint of roadmap.nodes.filter(
    (node) => node.chapterCheckpoint === true,
  )) {
    if (seenCheckpointIds.has(checkpoint.id)) {
      errors.push(`[${slug}] Duplicate checkpoint id: ${checkpoint.id}`);
    }
    seenCheckpointIds.add(checkpoint.id);

    const sectionCheckpoints = checkpointsBySection.get(checkpoint.sectionId) ?? [];
    sectionCheckpoints.push(checkpoint);
    checkpointsBySection.set(checkpoint.sectionId, sectionCheckpoints);

    if (!sectionIds.has(checkpoint.sectionId)) {
      errors.push(
        `[${slug}] Checkpoint ${checkpoint.id} references unknown section: ${checkpoint.sectionId}`,
      );
    }
  }

  const mappedSectionIds = new Set([
    ...sectionIds,
    ...quizzesBySection.keys(),
    ...checkpointsBySection.keys(),
  ]);

  for (const sectionId of mappedSectionIds) {
    const sectionQuizzes = quizzesBySection.get(sectionId) ?? [];
    const sectionCheckpoints = checkpointsBySection.get(sectionId) ?? [];

    if (sectionQuizzes.length === 0) {
      errors.push(`[${slug}] Missing quiz for section: ${sectionId}`);
    } else if (sectionQuizzes.length > 1) {
      errors.push(
        `[${slug}] Multiple quizzes for section ${sectionId}: ${sectionQuizzes
          .map((quiz) => quiz.id)
          .join(", ")}`,
      );
    }

    if (sectionCheckpoints.length === 0) {
      errors.push(`[${slug}] Missing chapterCheckpoint node for section: ${sectionId}`);
    } else if (sectionCheckpoints.length > 1) {
      errors.push(
        `[${slug}] Multiple chapterCheckpoint nodes for section ${sectionId}: ${sectionCheckpoints
          .map((checkpoint) => checkpoint.id)
          .join(", ")}`,
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
  (sum, catalog) => sum + catalog.roadmap.sections.length,
  0,
);
console.log(
  `Chapter quiz verification passed (${totalSections} sections across ${catalogs.length} roadmaps).`,
);
