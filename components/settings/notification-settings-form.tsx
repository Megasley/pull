"use client";

import { useState, useTransition } from "react";

import { updateEmailNotificationPrefsAction } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import type { EmailNotificationPrefs } from "@/types/notifications";

type NotificationSettingsFormProps = {
  email: string | null;
  prefs: EmailNotificationPrefs;
};

const TOGGLES: {
  key: keyof EmailNotificationPrefs;
  label: string;
  description: string;
}[] = [
  {
    key: "reviewOutcomes",
    label: "Review outcomes",
    description: "Approved, changes requested, and rejected submissions.",
  },
  {
    key: "reviewQueue",
    label: "Review queue",
    description: "New submissions waiting for review (reviewers and admins).",
  },
  {
    key: "achievements",
    label: "Achievements",
    description: "When you unlock one or more achievements.",
  },
  {
    key: "product",
    label: "Product updates",
    description: "Welcome email and role grants (reviewer / admin).",
  },
];

export function NotificationSettingsForm({
  email,
  prefs,
}: NotificationSettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-6"
      action={(formData) => {
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await updateEmailNotificationPrefsAction(formData);
          if (!result.ok) {
            setError(
              result.reason === "unauthenticated"
                ? "Sign in to update preferences."
                : (result.error ?? "Could not save preferences."),
            );
            return;
          }
          setMessage("Preferences saved.");
        });
      }}
    >
      <div className="space-y-1 border border-border bg-muted/40 px-4 py-3">
        <p className="tech-eyebrow">delivery email</p>
        <p className="font-mono text-sm text-foreground">
          {email ?? "GitHub did not share an email for this account."}
        </p>
        {!email ? (
          <p className="font-mono text-xs text-muted-foreground">
            Emails cannot be delivered until GitHub provides an address on the
            next sign-in.
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-4">
        <legend className="tech-eyebrow">categories</legend>
        {TOGGLES.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start gap-3 border border-border px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <input
              type="checkbox"
              name={item.key}
              defaultChecked={prefs[item.key]}
              className="mt-1 size-4 accent-[var(--signal)]"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">
                {item.label}
              </span>
              <span className="block font-mono text-xs text-muted-foreground">
                {item.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="font-mono text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="font-mono text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}

      <Button type="submit" loading={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
