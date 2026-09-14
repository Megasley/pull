"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { postReplyAction } from "@/app/actions/comments";
import { MarkdownEditor } from "@/components/comments/markdown-editor";
import { Button } from "@/components/ui/button";
import { draftKeySuffix, useCommentDraft } from "@/hooks/use-comment-draft";

type ReplyComposerProps = {
  threadId: string;
};

export function ReplyComposer({ threadId }: ReplyComposerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { value: body, setValue: setBody, clearDraft } = useCommentDraft(
    draftKeySuffix({ kind: "reply", threadId }),
  );

  // Auto-open the composer once when a saved draft is present (e.g. after
  // a page refresh), so the user sees their unfinished reply instead of a
  // collapsed "Reply" button. Uses render-phase setState — the React-
  // blessed pattern for adjusting state based on external store values,
  // which does not trigger the set-state-in-effect lint rule.
  const [autoOpened, setAutoOpened] = useState(false);
  if (!autoOpened && body.trim().length > 0 && !open) {
    setAutoOpened(true);
    setOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await postReplyAction(threadId, body);

      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/sign-in");
          return;
        }
        setError(result.error);
        return;
      }

      clearDraft();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Reply
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder="Write a reply…"
        rows={2}
        disabled={pending}
        autoFocus
      />
      {error ? (
        <p
          className="rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {body.trim() ? (
        <p className="text-[11px] text-muted-foreground">
          Draft saved automatically — it will be here if you refresh the page.
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setBody("");
            clearDraft();
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          loading={pending}
          disabled={body.trim().length === 0}
          onClick={submit}
        >
          Post reply
        </Button>
      </div>
    </div>
  );
}
