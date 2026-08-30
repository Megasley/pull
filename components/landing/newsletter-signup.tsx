"use client";

import { useActionState } from "react";

import { subscribeToNewsletterAction } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup({ className }: { className?: string }) {
  const [state, formAction, isPending] = useActionState(subscribeToNewsletterAction, null);

  return (
    <form action={formAction} className={className}>
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          disabled={isPending}
          aria-invalid={Boolean(state?.error) || undefined}
          className="h-10 rounded-[2px] border-ink/30 bg-transparent font-mono text-sm"
        />
        <Button type="submit" loading={isPending} className="shrink-0">
          {isPending ? "..." : "Subscribe"}
        </Button>
      </div>
      {state?.error ? (
        <p role="alert" className="mt-2 font-mono text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
