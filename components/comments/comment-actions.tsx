"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteCommentAction, editCommentAction } from "@/app/actions/comments";
import { MarkdownEditor } from "@/components/comments/markdown-editor";
import { Button } from "@/components/ui/button";
import { draftKeySuffix, useCommentDraft } from "@/hooks/use-comment-draft";

type CommentActionsProps = {
  commentId: string;
  initialBody: string;
};

/** Edit/delete controls for a comment the viewer owns. Edit replaces this
 *  component with an inline MarkdownEditor (the surrounding body text stays
 *  as-is until the page refreshes with the saved copy); delete asks for
 *  confirmation inline rather than a native browser dialog.
 *
 *  Unsaved edit drafts persist to localStorage so a page refresh mid-edit
 *  doesn't lose work. The draft is cleared on save or cancel. When no draft
 *  exists, the hook falls back to `initialBody` automatically. */
export function CommentActions({ commentId, initialBody }: CommentActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "editing" | "confirm-delete">("idle");
  const { value: draft, setValue: setDraft, clearDraft } = useCommentDraft(
    draftKeySuffix({ kind: "edit", commentId }),
    initialBody,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveEdit() {
    setError(null);
    startTransition(async () => {
      const result = await editCommentAction(commentId, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearDraft();
      setMode("idle");
      router.refresh();
    });
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCommentAction(commentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (mode === "editing") {
    return (
      <div className="space-y-2">
        <MarkdownEditor
          value={draft}
          onChange={setDraft}
          rows={2}
          disabled={pending}
          autoFocus
        />
        {draft.trim() ? (
          <p className="text-[11px] text-muted-foreground">
            Draft saved automatically — it will be here if you refresh the page.
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              clearDraft();
              setDraft(initialBody);
              setMode("idle");
              setError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={draft.trim().length === 0}
            onClick={saveEdit}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Delete this comment?</span>
        {error ? (
          <span className="text-xs text-destructive" role="alert">
            {error}
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setMode("idle")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          loading={pending}
          onClick={confirmDelete}
        >
          Delete
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => {
          setMode("editing");
        }}
      >
        Edit
      </Button>
      <Button type="button" variant="ghost" size="xs" onClick={() => setMode("confirm-delete")}>
        Delete
      </Button>
    </div>
  );
}
