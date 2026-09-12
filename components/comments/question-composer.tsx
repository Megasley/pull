"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { postQuestionAction } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";
import type { CommentEntityInput } from "@/types/comments";

type QuestionComposerProps = {
  entity: CommentEntityInput;
};

export function QuestionComposer({ entity }: QuestionComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-none border border-border bg-card p-4">
      <label htmlFor="qa-question-body" className="text-sm font-medium">
        Ask a question
      </label>
      <textarea
        id="qa-question-body"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Stuck on something here? Ask the community…"
        disabled={pending}
        className="w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {error ? (
        <p
          className="rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
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
