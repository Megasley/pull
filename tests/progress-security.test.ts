import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requireActiveAccount: vi.fn(),
  getAllCompletedNodeSlugs: vi.fn(),
  getCompletedNodeSlugs: vi.fn(),
  setNodeCompletion: vi.fn(),
  getChapterQuizStatus: vi.fn(),
  getChapterQuizStatuses: vi.fn(),
  recordChapterQuizPassed: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/auth/require-active-account", () => ({
  moderationBlockedMessage: vi.fn((reason: string) => reason),
  requireActiveAccount: mocks.requireActiveAccount,
}));
vi.mock("@/lib/progress/repository", () => ({
  getAllCompletedNodeSlugs: mocks.getAllCompletedNodeSlugs,
  getCompletedNodeSlugs: mocks.getCompletedNodeSlugs,
  setNodeCompletion: mocks.setNodeCompletion,
}));
vi.mock("@/lib/progress/quiz-repository", () => ({
  getChapterQuizStatus: mocks.getChapterQuizStatus,
  getChapterQuizStatuses: mocks.getChapterQuizStatuses,
  recordChapterQuizPassed: mocks.recordChapterQuizPassed,
}));

import * as progressActions from "@/app/actions/progress";
import {
  submitChapterQuizAction,
  toggleLessonProgressAction,
} from "@/app/actions/progress";
import { evaluateEarnedAchievementSlugs } from "@/lib/achievements/evaluate";
import { getChapterQuizzesForRoadmap } from "@/lib/quizzes/load";
import { getRoadmap } from "@/lib/roadmap/load-roadmap";

const activeProfile = {
  id: "builder-id",
  role: "builder",
  accountStatus: "active",
};

function answersFor(roadmapSlug: string, mode: "correct" | "wrong") {
  const quiz = getChapterQuizzesForRoadmap(roadmapSlug)[0];
  return {
    quiz,
    answers: quiz.questions.map((question) => ({
      questionId: question.id,
      optionId:
        mode === "correct"
          ? question.correctOptionId
          : question.options.find((option) => option.id !== question.correctOptionId)!
              .id,
    })),
  };
}

describe("progress action security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireActiveAccount.mockResolvedValue({ ok: true, profile: activeProfile });
    mocks.getCompletedNodeSlugs.mockResolvedValue([]);
    mocks.getChapterQuizStatus.mockResolvedValue(null);
  });

  it("does not expose client-controlled bulk progress actions", () => {
    expect("mergeRoadmapProgressAction" in progressActions).toBe(false);
    expect("replaceRoadmapProgressAction" in progressActions).toBe(false);
    expect("syncRoadmapProgressAction" in progressActions).toBe(false);
  });

  it("rejects unknown and mismatched roadmap nodes without writing", async () => {
    await expect(
      toggleLessonProgressAction("not-a-roadmap", "fabricated-node", true),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_roadmap" });

    const lightningNode = getRoadmap("lightning")!.nodes[0];
    await expect(
      toggleLessonProgressAction("bitcoin", lightningNode.id, true),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_node" });

    expect(mocks.setNodeCompletion).not.toHaveBeenCalled();
  });

  it("rejects a locked node until its prerequisites are complete", async () => {
    const roadmap = getRoadmap("bitcoin")!;
    const node = roadmap.nodes.find((item) => item.lockedUntil?.length)!;

    await expect(
      toggleLessonProgressAction("bitcoin", node.id, true),
    ).resolves.toMatchObject({ ok: false, reason: "node_locked" });
    expect(mocks.setNodeCompletion).not.toHaveBeenCalled();

    mocks.getCompletedNodeSlugs.mockResolvedValue(node.lockedUntil);
    await expect(toggleLessonProgressAction("bitcoin", node.id, true)).resolves.toEqual(
      { ok: true },
    );
    expect(mocks.setNodeCompletion).toHaveBeenCalledWith(
      activeProfile.id,
      "bitcoin",
      node.id,
      true,
    );
  });

  it("rejects a roadmap until its prerequisite roadmap is complete", async () => {
    const lightning = getRoadmap("lightning")!;

    await expect(
      toggleLessonProgressAction("lightning", lightning.nodes[0].id, true),
    ).resolves.toMatchObject({ ok: false, reason: "roadmap_locked" });
    expect(mocks.setNodeCompletion).not.toHaveBeenCalled();

    const bitcoin = getRoadmap("bitcoin")!;
    mocks.getCompletedNodeSlugs.mockImplementation(
      async (_userId: string, roadmapSlug: string) =>
        roadmapSlug === "bitcoin" ? bitcoin.nodes.map((node) => node.id) : [],
    );
    await expect(
      toggleLessonProgressAction("lightning", lightning.nodes[0].id, true),
    ).resolves.toEqual({ ok: true });
  });

  it("requires a recorded pass before completing a checkpoint", async () => {
    const roadmap = getRoadmap("bitcoin")!;
    const checkpoint = roadmap.nodes.find((node) => node.chapterCheckpoint)!;
    mocks.getCompletedNodeSlugs.mockResolvedValue(checkpoint.lockedUntil ?? []);

    await expect(
      toggleLessonProgressAction("bitcoin", checkpoint.id, true),
    ).resolves.toMatchObject({ ok: false, reason: "chapter_quiz_required" });
    expect(mocks.setNodeCompletion).not.toHaveBeenCalled();

    mocks.getChapterQuizStatus.mockResolvedValue("skipped");
    await expect(
      toggleLessonProgressAction("bitcoin", checkpoint.id, true),
    ).resolves.toMatchObject({ ok: false, reason: "chapter_quiz_required" });
    expect(mocks.setNodeCompletion).not.toHaveBeenCalled();

    mocks.getChapterQuizStatus.mockResolvedValue("passed");
    await expect(
      toggleLessonProgressAction("bitcoin", checkpoint.id, true),
    ).resolves.toEqual({ ok: true });
  });
});

describe("chapter quiz security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireActiveAccount.mockResolvedValue({ ok: true, profile: activeProfile });
  });

  it("rejects fabricated quiz identifiers without persistence", async () => {
    await expect(
      submitChapterQuizAction({
        roadmapSlug: "bitcoin",
        quizId: "fabricated-quiz",
        answers: [],
      }),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_quiz" });
    expect(mocks.recordChapterQuizPassed).not.toHaveBeenCalled();
  });

  it("rejects incomplete and duplicate answer payloads", async () => {
    const { quiz, answers } = answersFor("bitcoin", "correct");

    await expect(
      submitChapterQuizAction({
        roadmapSlug: "bitcoin",
        quizId: quiz.id,
        answers: answers.slice(1),
      }),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_answers" });

    await expect(
      submitChapterQuizAction({
        roadmapSlug: "bitcoin",
        quizId: quiz.id,
        answers: answers.map((answer) => ({
          ...answer,
          questionId: answers[0].questionId,
        })),
      }),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_answers" });
    expect(mocks.recordChapterQuizPassed).not.toHaveBeenCalled();
  });

  it("rejects unknown options and the legacy client score contract", async () => {
    const { quiz, answers } = answersFor("bitcoin", "correct");
    const invalidOptionAnswers = answers.map((answer, index) =>
      index === 0 ? { ...answer, optionId: "not-an-option" } : answer,
    );

    await expect(
      submitChapterQuizAction({
        roadmapSlug: "bitcoin",
        quizId: quiz.id,
        answers: invalidOptionAnswers,
      }),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_answers" });

    await expect(
      submitChapterQuizAction({
        roadmapSlug: "bitcoin",
        quizId: quiz.id,
        score: quiz.questions.length,
      } as never),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_answers" });
    expect(mocks.recordChapterQuizPassed).not.toHaveBeenCalled();
  });

  it("does not record or reward a server-calculated failing score", async () => {
    const { quiz, answers } = answersFor("bitcoin", "wrong");

    await expect(
      submitChapterQuizAction({ roadmapSlug: "bitcoin", quizId: quiz.id, answers }),
    ).resolves.toEqual({ ok: true, passed: false, score: 0 });
    expect(mocks.recordChapterQuizPassed).not.toHaveBeenCalled();
  });

  it("records a canonical pass with the server-calculated score", async () => {
    const { quiz, answers } = answersFor("bitcoin", "correct");

    await expect(
      submitChapterQuizAction({ roadmapSlug: "bitcoin", quizId: quiz.id, answers }),
    ).resolves.toEqual({ ok: true, passed: true, score: quiz.questions.length });
    expect(mocks.recordChapterQuizPassed).toHaveBeenCalledWith({
      userId: activeProfile.id,
      roadmapSlug: "bitcoin",
      quizId: quiz.id,
      score: quiz.questions.length,
    });
  });

  it("does not expose a chapter quiz skip action", () => {
    expect("skipChapterQuizAction" in progressActions).toBe(false);
  });
});

describe("achievement progress integrity", () => {
  it("ignores unknown roadmap and node identifiers in count achievements", () => {
    const earned = evaluateEarnedAchievementSlugs({
      progressByRoadmap: {
        fabricated: ["one", "two"],
        bitcoin: ["fabricated-node"],
      },
      approvedSubmissionCount: 0,
      githubPrCount: 0,
      githubMergedPrCount: 0,
      githubPrReadyForReviewCount: 0,
      githubVerifiedMergedPrCount: 0,
    });

    expect(earned).not.toContain("first-lesson");
    expect(earned).not.toContain("bitcoin-apprentice");
  });
});
