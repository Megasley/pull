"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { acceptAnswerAction } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";

type AcceptAnswerButtonProps = {
  replyId: string;
};

export function AcceptAnswerButton({ replyId }: AcceptAnswerButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptAnswerAction(replyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" loading={pending} onClick={accept}>
        Accept as answer
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
