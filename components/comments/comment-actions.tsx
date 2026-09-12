"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteCommentAction, editCommentAction } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";

type CommentActionsProps = {
  commentId: string;
  initialBody: string;
};

/** Edit/delete controls for a comment the viewer owns. Edit replaces this
 *  component with an inline textarea (the surrounding body text stays as-is
 *  until the page refreshes with the saved copy); delete asks for
 *  confirmation inline rather than a native browser dialog. */
export function CommentActions({ commentId, initialBody }: CommentActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "editing" | "confirm-delete">("idle");
  const [draft, setDraft] = useState(initialBody);
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
        <textarea
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={pending}
          autoFocus
          className="w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
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
              setMode("idle");
              setDraft(initialBody);
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
          setDraft(initialBody);
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
