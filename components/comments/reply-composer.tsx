"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { postReplyAction } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";

type ReplyComposerProps = {
  threadId: string;
};

export function ReplyComposer({ threadId }: ReplyComposerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

      setBody("");
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
      <textarea
        rows={2}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write a reply…"
        disabled={pending}
        autoFocus
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
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setBody("");
            setError(null);
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
