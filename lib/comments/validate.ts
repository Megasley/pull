export const MAX_COMMENT_BODY_LENGTH = 4000;

export type CommentBodyValidationResult =
  | { ok: true; body: string }
  | { ok: false; reason: "body_required" | "body_too_long" };

export function validateCommentBody(body: string): CommentBodyValidationResult {
  const trimmed = body.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: "body_required" };
  }

  if (trimmed.length > MAX_COMMENT_BODY_LENGTH) {
    return { ok: false, reason: "body_too_long" };
  }

  return { ok: true, body: trimmed };
}
