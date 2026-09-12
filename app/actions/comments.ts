"use server";

import { revalidatePath } from "next/cache";

import { recordAdminAction } from "@/lib/admin/audit-log";
import { requireActiveAccount } from "@/lib/auth/require-active-account";
import {
  acceptAnswer,
  createQuestion,
  createReply,
  deleteComment,
  describeEntity,
  editComment,
  hideComment,
  isRateLimited,
  listThreadsForEntity,
  resolveEntityRef,
} from "@/lib/comments/repository";
import { validateCommentBody } from "@/lib/comments/validate";
import {
  notifyAnswerAcceptedAsync,
  notifyNewReplyAsync,
} from "@/lib/notifications/dispatch";
import { qaAnswerXpKey } from "@/lib/xp/config";
import { awardXp } from "@/lib/xp/repository";
import type {
  CommentEntityInput,
  CommentEntityRef,
  CommentMutationReason,
} from "@/types/comments";

async function requireCommentActor() {
  const gate = await requireActiveAccount();
  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }
  return { ok: true as const, profile: gate.profile };
}

function commentErrorMessage(reason: CommentMutationReason) {
  switch (reason) {
    case "body_required":
      return "Write something before posting.";
    case "body_too_long":
      return "Keep it under 4,000 characters.";
    case "not_found":
      return "This thread no longer exists.";
    case "not_question_author":
      return "Only the person who asked can accept an answer.";
    case "already_accepted":
      return "This question already has an accepted answer.";
    case "cannot_accept_own_reply":
      return "You can't accept your own reply as the answer.";
    case "not_owner":
      return "You can only edit or delete your own comment.";
    case "rate_limited":
      return "You're posting too fast — try again in a moment.";
    case "staff_only":
      return "Only staff can hide comments.";
    case "suspended":
      return "Your account is suspended. Posting is disabled until an admin restores access.";
    case "banned":
      return "Your account has been banned.";
    default:
      return "Sign in to continue.";
  }
}

function revalidateCommentPaths(entity: CommentEntityRef) {
  if (entity.entityType === "project") {
    revalidatePath(`/projects`);
    return;
  }
  if (entity.entityType === "roadmap_step") {
    revalidatePath(`/roadmaps/${entity.roadmapSlug}`);
    return;
  }
  revalidatePath(`/developer-tools/${entity.developerToolSlug}`);
}

export async function listThreadsForEntityAction(entityInput: CommentEntityInput) {
  const entity = await resolveEntityRef(entityInput);
  if (!entity) {
    return { ok: false as const, reason: "not_found" as const, threads: [] };
  }
  const threads = await listThreadsForEntity(entity);
  return { ok: true as const, threads };
}

export async function postQuestionAction(entityInput: CommentEntityInput, body: string) {
  const gate = await requireCommentActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: commentErrorMessage(gate.reason),
    };
  }

  const validated = validateCommentBody(body);
  if (!validated.ok) {
    return {
      ok: false as const,
      reason: validated.reason,
      error: commentErrorMessage(validated.reason),
    };
  }

  const entity = await resolveEntityRef(entityInput);
  if (!entity) {
    return {
      ok: false as const,
      reason: "not_found" as const,
      error: commentErrorMessage("not_found"),
    };
  }

  if (await isRateLimited(gate.profile.id)) {
    return {
      ok: false as const,
      reason: "rate_limited" as const,
      error: commentErrorMessage("rate_limited"),
    };
  }

  const question = await createQuestion({
    entity,
    authorId: gate.profile.id,
    body: validated.body,
  });

  revalidateCommentPaths(entity);
  return { ok: true as const, id: question.id };
}

export async function postReplyAction(threadId: string, body: string) {
  const gate = await requireCommentActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: commentErrorMessage(gate.reason),
    };
  }

  const validated = validateCommentBody(body);
  if (!validated.ok) {
    return {
      ok: false as const,
      reason: validated.reason,
      error: commentErrorMessage(validated.reason),
    };
  }

  if (await isRateLimited(gate.profile.id)) {
    return {
      ok: false as const,
      reason: "rate_limited" as const,
      error: commentErrorMessage("rate_limited"),
    };
  }

  const result = await createReply({
    threadId,
    authorId: gate.profile.id,
    body: validated.body,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: commentErrorMessage(result.reason),
    };
  }

  revalidateCommentPaths(result.threadEntity);

  if (result.questionAuthorId && result.questionAuthorId !== gate.profile.id) {
    const { title, href } = await describeEntity(result.threadEntity);
    notifyNewReplyAsync({
      questionAuthorUserId: result.questionAuthorId,
      replyAuthorUsername: gate.profile.username,
      entityTitle: title,
      href,
    });
  }

  return { ok: true as const, id: result.id };
}

export async function acceptAnswerAction(replyId: string) {
  const gate = await requireCommentActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: commentErrorMessage(gate.reason),
    };
  }

  const result = await acceptAnswer({ replyId, askerUserId: gate.profile.id });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: commentErrorMessage(result.reason),
    };
  }

  // Ships as one-way for v1 — no unmark/reverse path (see plan). Idempotent
  // via awardXp's unique (userId, sourceType, sourceKey) conflict-do-nothing,
  // keyed on the reply's own id.
  if (result.replyAuthorId) {
    await awardXp({
      userId: result.replyAuthorId,
      sourceType: "qa_answer_accepted",
      sourceKey: qaAnswerXpKey(replyId),
      metadata: { threadEntity: result.threadEntity },
    });

    const { title, href } = await describeEntity(result.threadEntity);
    notifyAnswerAcceptedAsync({
      answerAuthorUserId: result.replyAuthorId,
      entityTitle: title,
      href,
    });
  }

  revalidateCommentPaths(result.threadEntity);
  return { ok: true as const };
}

export async function editCommentAction(commentId: string, body: string) {
  const gate = await requireCommentActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: commentErrorMessage(gate.reason),
    };
  }

  const validated = validateCommentBody(body);
  if (!validated.ok) {
    return {
      ok: false as const,
      reason: validated.reason,
      error: commentErrorMessage(validated.reason),
    };
  }

  const result = await editComment({
    commentId,
    authorId: gate.profile.id,
    body: validated.body,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: commentErrorMessage(result.reason),
    };
  }

  revalidateCommentPaths(result.threadEntity);
  return { ok: true as const };
}

export async function deleteCommentAction(commentId: string) {
  const gate = await requireCommentActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: commentErrorMessage(gate.reason),
    };
  }

  const result = await deleteComment({ commentId, authorId: gate.profile.id });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: commentErrorMessage(result.reason),
    };
  }

  revalidateCommentPaths(result.threadEntity);
  return { ok: true as const };
}

export async function adminHideCommentAction(commentId: string, reason: string) {
  const gate = await requireCommentActor();
  if (!gate.ok) {
    return {
      ok: false as const,
      reason: gate.reason,
      error: commentErrorMessage(gate.reason),
    };
  }

  if (gate.profile.role !== "admin") {
    return {
      ok: false as const,
      reason: "staff_only" as const,
      error: commentErrorMessage("staff_only"),
    };
  }

  const result = await hideComment({ commentId });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: commentErrorMessage(result.reason),
    };
  }

  await recordAdminAction({
    actorUserId: gate.profile.id,
    targetUserId: result.authorId,
    action: "hide_comment",
    metadata: { commentId, reason },
  });

  revalidateCommentPaths(result.threadEntity);
  return { ok: true as const };
}
