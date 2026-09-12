export type CommentEntityType = "roadmap_step" | "project" | "developer_tool";

export type CommentEntityRef =
  | { entityType: "project"; projectId: string }
  | { entityType: "roadmap_step"; roadmapSlug: string; roadmapNodeSlug: string }
  | { entityType: "developer_tool"; developerToolSlug: string };

/**
 * What a page actually has on hand to identify an entity — a catalog slug
 * for projects (pages don't carry the DB uuid), vs. the resolved uuid in
 * `CommentEntityRef`. `resolveEntityRef` (lib/comments/repository.ts) turns
 * this into a `CommentEntityRef` after confirming the entity is real.
 */
export type CommentEntityInput =
  | { entityType: "project"; projectSlug: string }
  | { entityType: "roadmap_step"; roadmapSlug: string; roadmapNodeSlug: string }
  | { entityType: "developer_tool"; developerToolSlug: string };

export type CommentStatus = "visible" | "hidden" | "deleted";

export type CommentAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

/** A reply row — always a flat child of a root question, never nested further. */
export type CommentReplyRecord = {
  id: string;
  threadId: string;
  author: CommentAuthor | null;
  body: string;
  isAcceptedAnswer: boolean;
  acceptedAt: string | null;
  status: CommentStatus;
  editedAt: string | null;
  createdAt: string;
};

/** A root question row plus its flat list of replies. */
export type CommentThreadRecord = {
  id: string;
  entity: CommentEntityRef;
  author: CommentAuthor | null;
  body: string;
  status: CommentStatus;
  editedAt: string | null;
  createdAt: string;
  replies: CommentReplyRecord[];
  hasAcceptedAnswer: boolean;
};

export type CommentMutationReason =
  | "unauthenticated"
  | "suspended"
  | "banned"
  | "body_required"
  | "body_too_long"
  | "not_found"
  | "not_question_author"
  | "already_accepted"
  | "cannot_accept_own_reply"
  | "not_owner"
  | "rate_limited"
  | "staff_only";

export type CommentMutationResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; reason: CommentMutationReason; error: string };
