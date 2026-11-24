"use client";

import { useActionState, useId } from "react";

import { subscribeToNewsletterAction } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup({ className }: { className?: string }) {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletterAction,
    null,
  );
  const inputId = useId();
  const nameId = `${inputId}-name`;
  const errorId = `${inputId}-error`;

  return (
    <form action={formAction} className={className}>
      {/* Honeypot — hidden from humans */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${inputId}-website`}>Website</label>
        <input
          id={`${inputId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <label htmlFor={nameId} className="sr-only">
        First name (optional)
      </label>
      <Input
        id={nameId}
        key={`name-${state?.firstName ?? ""}`}
        defaultValue={state?.firstName ?? ""}
        name="firstName"
        autoComplete="given-name"
        placeholder="First name (optional)"
        maxLength={60}
        disabled={isPending}
        aria-invalid={state?.field === "firstName" || undefined}
        aria-describedby={state?.field === "firstName" ? errorId : undefined}
        className="mb-2 h-10 rounded-[2px] border-ink/30 bg-transparent font-mono text-sm"
      />
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          // Re-mount with the submitted value so an error doesn't clear it.
          key={`email-${state?.email ?? ""}`}
          defaultValue={state?.email ?? ""}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={isPending}
          aria-invalid={state?.field === "email" || undefined}
          aria-describedby={state?.field === "email" ? errorId : undefined}
          className="h-10 rounded-[2px] border-ink/30 bg-transparent font-mono text-sm"
        />
        <Button type="submit" loading={isPending} className="shrink-0">
          {isPending ? "..." : "Subscribe"}
        </Button>
      </div>
      {state?.error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 font-mono text-xs text-destructive"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
