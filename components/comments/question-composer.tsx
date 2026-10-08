"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { postQuestionAction } from "@/app/actions/comments";
import { MarkdownEditor } from "@/components/comments/markdown-editor";
import { Button } from "@/components/ui/button";
import {
  draftKeySuffix,
  questionEntityKey,
  useCommentDraft,
} from "@/hooks/use-comment-draft";
import type { CommentEntityInput } from "@/types/comments";

type QuestionComposerProps = {
  entity: CommentEntityInput;
};

export function QuestionComposer({ entity }: QuestionComposerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { value: body, setValue: setBody, clearDraft } = useCommentDraft(
    draftKeySuffix({ kind: "question", entityKey: questionEntityKey(entity) }),
  );

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await postQuestionAction(entity, body);

      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/sign-in");
          return;
        }
        setError(result.error);
        return;
      }

      clearDraft();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-none border border-border bg-card p-4">
      <label htmlFor="qa-question-body" className="text-sm font-medium">
        Ask a question
      </label>
      <MarkdownEditor
        id="qa-question-body"
        value={body}
        onChange={setBody}
        placeholder="Stuck on something here? Ask the community…"
        rows={3}
        disabled={pending}
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
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          loading={pending}
          disabled={body.trim().length === 0}
          onClick={submit}
        >
          Post question
        </Button>
      </div>
    </div>
  );
}
