import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { comments, projects, users } from "@/lib/db/schema";
import { getDeveloperToolBySlug } from "@/lib/developer-tools";
import { getRoadmap } from "@/lib/roadmap/load-roadmap";
import type {
  CommentAuthor,
  CommentEntityInput,
  CommentEntityRef,
  CommentReplyRecord,
  CommentThreadRecord,
} from "@/types/comments";

const RATE_LIMIT_WINDOW_SECONDS = 30;
const RATE_LIMIT_MAX_POSTS = 3;

function mapAuthor(row: {
  authorId: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
}): CommentAuthor | null {
  if (!row.authorId || !row.username || !row.displayName) {
    return null;
  }
  return {
    id: row.authorId,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatar,
  };
}

function entityWhereClause(entity: CommentEntityRef) {
  if (entity.entityType === "project") {
    return and(
      eq(comments.entityType, "project"),
      eq(comments.projectId, entity.projectId),
    );
  }
  if (entity.entityType === "roadmap_step") {
    return and(
      eq(comments.entityType, "roadmap_step"),
      eq(comments.roadmapSlug, entity.roadmapSlug),
      eq(comments.roadmapNodeSlug, entity.roadmapNodeSlug),
    );
  }
  return and(
    eq(comments.entityType, "developer_tool"),
    eq(comments.developerToolSlug, entity.developerToolSlug),
  );
}

/**
 * Confirms the entity a new comment is being attached to is real, by looking
 * it up against actual content/DB state rather than trusting a client-
 * supplied slug or id. Returns the resolved `CommentEntityRef` (with the
 * DB project id filled in, for the `project` case) or `null` if not found.
 */
export async function resolveEntityRef(
  input: CommentEntityInput,
): Promise<CommentEntityRef | null> {
  if (input.entityType === "roadmap_step") {
    const roadmap = getRoadmap(input.roadmapSlug);
    const nodeExists = roadmap?.nodes.some((node) => node.id === input.roadmapNodeSlug);
    if (!roadmap || !nodeExists) {
      return null;
    }
    return {
      entityType: "roadmap_step",
      roadmapSlug: input.roadmapSlug,
      roadmapNodeSlug: input.roadmapNodeSlug,
    };
  }

  if (input.entityType === "developer_tool") {
    const tool = getDeveloperToolBySlug(input.developerToolSlug);
    if (!tool) {
      return null;
    }
    return { entityType: "developer_tool", developerToolSlug: tool.slug };
  }

  if (!isDatabaseConfigured()) {
    return null;
  }
  const db = getDb();
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, input.projectSlug))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  return { entityType: "project", projectId: row.id };
}

/** A human-readable title + in-app href for an entity, used by notification
 *  emails (see app/actions/comments.ts and lib/notifications/dispatch.ts). */
export async function describeEntity(
  entity: CommentEntityRef,
): Promise<{ title: string; href: string }> {
  if (entity.entityType === "roadmap_step") {
    const roadmap = getRoadmap(entity.roadmapSlug);
    const node = roadmap?.nodes.find((n) => n.id === entity.roadmapNodeSlug);
    return {
      title: node?.title ?? entity.roadmapNodeSlug,
      href: `/roadmaps/${entity.roadmapSlug}/lessons/${entity.roadmapNodeSlug}#lesson-discussion-heading`,
    };
  }

  if (entity.entityType === "developer_tool") {
    const tool = getDeveloperToolBySlug(entity.developerToolSlug);
    return {
      title: tool?.name ?? entity.developerToolSlug,
      href: `/developer-tools/${entity.developerToolSlug}`,
    };
  }

  if (!isDatabaseConfigured()) {
    return { title: "a project", href: "/projects" };
  }
  const db = getDb();
  const rows = await db
    .select({ slug: projects.slug, title: projects.title })
    .from(projects)
    .where(eq(projects.id, entity.projectId))
    .limit(1);
  const row = rows[0];
  return {
    title: row?.title ?? "a project",
    href: row ? `/projects/${row.slug}#discussion` : "/projects",
  };
}

export async function isRateLimited(authorId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(
      and(
        eq(comments.authorId, authorId),
        sql`${comments.createdAt} > now() - (${RATE_LIMIT_WINDOW_SECONDS} || ' seconds')::interval`,
      ),
    );
  return (rows[0]?.count ?? 0) >= RATE_LIMIT_MAX_POSTS;
}

export async function listThreadsForEntity(
  entity: CommentEntityRef,
): Promise<CommentThreadRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  const db = getDb();

  const rows = await db
    .select({
      comment: comments,
      username: users.username,
      displayName: users.displayName,
      avatar: users.avatar,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(
      and(
        entityWhereClause(entity),
        // "deleted" rows stay in the result set (rendered as a tombstone —
        // deleting a question must not make its replies vanish); "hidden"
        // (admin-moderated) rows are excluded entirely from public view.
        sql`${comments.status} != 'hidden'`,
      ),
    )
    .orderBy(asc(comments.createdAt));

  const questionRows = rows.filter((row) => row.comment.isQuestion);
  const replyRowsByThread = new Map<string, typeof rows>();
  for (const row of rows) {
    if (row.comment.isQuestion || !row.comment.threadId) continue;
    const list = replyRowsByThread.get(row.comment.threadId) ?? [];
    list.push(row);
    replyRowsByThread.set(row.comment.threadId, list);
  }

  return questionRows.map((row): CommentThreadRecord => {
    const replies: CommentReplyRecord[] = (replyRowsByThread.get(row.comment.id) ?? []).map(
      (reply) => ({
        id: reply.comment.id,
        threadId: reply.comment.threadId!,
        author: mapAuthor({
          authorId: reply.comment.authorId,
          username: reply.username,
          displayName: reply.displayName,
          avatar: reply.avatar,
        }),
        body: reply.comment.body,
        isAcceptedAnswer: reply.comment.isAcceptedAnswer,
        acceptedAt: reply.comment.acceptedAt,
        status: reply.comment.status,
        editedAt: reply.comment.editedAt,
        createdAt: reply.comment.createdAt,
      }),
    );

    return {
      id: row.comment.id,
      entity,
      author: mapAuthor({
        authorId: row.comment.authorId,
        username: row.username,
        displayName: row.displayName,
        avatar: row.avatar,
      }),
      body: row.comment.body,
      status: row.comment.status,
      editedAt: row.comment.editedAt,
      createdAt: row.comment.createdAt,
      replies,
      hasAcceptedAnswer: replies.some((reply) => reply.isAcceptedAnswer),
    };
  });
}

export async function getRootComment(threadId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, threadId), eq(comments.isQuestion, true)))
    .limit(1);
  return rows[0] ?? null;
}

function entityRefFromRow(row: typeof comments.$inferSelect): CommentEntityRef {
  if (row.entityType === "project") {
    return { entityType: "project", projectId: row.projectId! };
  }
  if (row.entityType === "roadmap_step") {
    return {
      entityType: "roadmap_step",
      roadmapSlug: row.roadmapSlug!,
      roadmapNodeSlug: row.roadmapNodeSlug!,
    };
  }
  return { entityType: "developer_tool", developerToolSlug: row.developerToolSlug! };
}

function entityColumns(entity: CommentEntityRef) {
  return {
    entityType: entity.entityType,
    projectId: entity.entityType === "project" ? entity.projectId : null,
    roadmapSlug: entity.entityType === "roadmap_step" ? entity.roadmapSlug : null,
    roadmapNodeSlug:
      entity.entityType === "roadmap_step" ? entity.roadmapNodeSlug : null,
    developerToolSlug:
      entity.entityType === "developer_tool" ? entity.developerToolSlug : null,
  } as const;
}

export async function createQuestion(input: {
  entity: CommentEntityRef;
  authorId: string;
  body: string;
}): Promise<{ id: string }> {
  const db = getDb();
  const [row] = await db
    .insert(comments)
    .values({
      ...entityColumns(input.entity),
      isQuestion: true,
      threadId: null,
      authorId: input.authorId,
      body: input.body,
    })
    .returning({ id: comments.id });
  return row;
}

export type CreateReplyResult =
  | { ok: true; id: string; threadEntity: CommentEntityRef; questionAuthorId: string | null }
  | { ok: false; reason: "not_found" };

export async function createReply(input: {
  threadId: string;
  authorId: string;
  body: string;
}): Promise<CreateReplyResult> {
  const root = await getRootComment(input.threadId);
  if (!root || root.status !== "visible") {
    return { ok: false, reason: "not_found" };
  }

  const [row] = await getDb()
    .insert(comments)
    .values({
      entityType: root.entityType,
      projectId: root.projectId,
      roadmapSlug: root.roadmapSlug,
      roadmapNodeSlug: root.roadmapNodeSlug,
      developerToolSlug: root.developerToolSlug,
      isQuestion: false,
      threadId: root.id,
      authorId: input.authorId,
      body: input.body,
    })
    .returning({ id: comments.id });

  return {
    ok: true,
    id: row.id,
    threadEntity: entityRefFromRow(root),
    questionAuthorId: root.authorId,
  };
}

export type AcceptAnswerResult =
  | { ok: true; replyAuthorId: string | null; threadEntity: CommentEntityRef }
  | {
      ok: false;
      reason: "not_found" | "not_question_author" | "already_accepted" | "cannot_accept_own_reply";
    };

/**
 * The asker marks one reply as the accepted answer — the "resolved" state
 * that triggers XP (see app/actions/comments.ts). One-way for v1: no
 * unmark/reverse path. The DB's `comments_thread_accepted_idx` partial
 * unique index is the final backstop against a race double-accepting, but
 * this checks first so callers get a clean reason instead of a raw
 * constraint-violation error.
 */
export async function acceptAnswer(input: {
  replyId: string;
  askerUserId: string;
}): Promise<AcceptAnswerResult> {
  const db = getDb();

  const replyRows = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, input.replyId), eq(comments.isQuestion, false)))
    .limit(1);
  const reply = replyRows[0];
  if (!reply || !reply.threadId || reply.status !== "visible") {
    return { ok: false, reason: "not_found" };
  }

  const root = await getRootComment(reply.threadId);
  if (!root || root.status !== "visible") {
    return { ok: false, reason: "not_found" };
  }

  if (root.authorId !== input.askerUserId) {
    return { ok: false, reason: "not_question_author" };
  }

  if (reply.authorId === input.askerUserId) {
    return { ok: false, reason: "cannot_accept_own_reply" };
  }

  const alreadyAccepted = await db
    .select({ id: comments.id })
    .from(comments)
    .where(and(eq(comments.threadId, root.id), eq(comments.isAcceptedAnswer, true)))
    .limit(1);
  if (alreadyAccepted[0]) {
    return { ok: false, reason: "already_accepted" };
  }

  await db
    .update(comments)
    .set({ isAcceptedAnswer: true, acceptedAt: new Date().toISOString() })
    .where(eq(comments.id, reply.id));

  return {
    ok: true,
    replyAuthorId: reply.authorId,
    threadEntity: entityRefFromRow(root),
  };
}

type OwnedCommentResult =
  | { ok: true; threadEntity: CommentEntityRef }
  | { ok: false; reason: "not_found" | "not_owner" };

async function getOwnedVisibleComment(
  commentId: string,
  authorId: string,
): Promise<
  | { ok: true; row: typeof comments.$inferSelect }
  | { ok: false; reason: "not_found" | "not_owner" }
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  const row = rows[0];
  if (!row || row.status !== "visible") {
    return { ok: false, reason: "not_found" };
  }
  if (row.authorId !== authorId) {
    return { ok: false, reason: "not_owner" };
  }
  return { ok: true, row };
}

export async function editComment(input: {
  commentId: string;
  authorId: string;
  body: string;
}): Promise<OwnedCommentResult> {
  const owned = await getOwnedVisibleComment(input.commentId, input.authorId);
  if (!owned.ok) {
    return owned;
  }

  const db = getDb();
  await db
    .update(comments)
    .set({ body: input.body, editedAt: new Date().toISOString() })
    .where(eq(comments.id, input.commentId));

  return { ok: true, threadEntity: entityRefFromRow(owned.row) };
}

/**
 * Soft delete: the row stays (so thread structure / accepted-answer history
 * survives, and a reply's parent thread never disappears out from under it),
 * but its body is tombstoned and hidden from further edits/replies. See
 * listThreadsForEntity — "deleted" rows still render, "hidden" ones don't.
 */
export async function deleteComment(input: {
  commentId: string;
  authorId: string;
}): Promise<OwnedCommentResult> {
  const owned = await getOwnedVisibleComment(input.commentId, input.authorId);
  if (!owned.ok) {
    return owned;
  }

  const db = getDb();
  await db
    .update(comments)
    .set({ status: "deleted" })
    .where(eq(comments.id, input.commentId));

  return { ok: true, threadEntity: entityRefFromRow(owned.row) };
}

export type HideCommentResult =
  | { ok: true; threadEntity: CommentEntityRef; authorId: string | null }
  | { ok: false; reason: "not_found" };

/** Admin-only moderation: fully removes a comment from public view (unlike a
 *  self-delete, it does not tombstone). Caller (app/actions/comments.ts)
 *  checks the staff role and writes the admin_audit_log entry. */
export async function hideComment(input: { commentId: string }): Promise<HideCommentResult> {
  const db = getDb();
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.id, input.commentId))
    .limit(1);
  const row = rows[0];
  if (!row || row.status !== "visible") {
    return { ok: false, reason: "not_found" };
  }

  await db
    .update(comments)
    .set({ status: "hidden" })
    .where(eq(comments.id, input.commentId));

  return { ok: true, threadEntity: entityRefFromRow(row), authorId: row.authorId };
}
