"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveProjectDraftAction, submitProjectAction } from "@/app/actions/submissions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSubmissionRecord } from "@/types/submission";
import { LOCKED_SUBMISSION_STATUSES } from "@/types/submission";

type ProjectSubmissionFormProps = {
  projectSlug: string;
  initial?: ProjectSubmissionRecord | null;
  locked?: boolean;
  className?: string;
};

const fieldClassName =
  "mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ProjectSubmissionForm({
  projectSlug,
  initial = null,
  locked = false,
  className,
}: ProjectSubmissionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isLocked =
    locked || (initial ? LOCKED_SUBMISSION_STATUSES.includes(initial.status) : false);

  function run(action: typeof saveProjectDraftAction, successMessage: string) {
    return (formData: FormData) => {
      setError(null);
      setMessage(null);
      startTransition(async () => {
        const result = await action(projectSlug, formData);

        if (!result.ok) {
          if (result.reason === "unauthenticated") {
            router.push(`/sign-in?next=/projects/${projectSlug}/submit`);
            return;
          }

          setError(
            "error" in result && result.error
              ? result.error
              : "Something went wrong. Please try again.",
          );
          return;
        }

        setMessage(successMessage);
        router.refresh();
      });
    };
  }

  return (
    <form className={cn("space-y-5", className)}>
      <Field
        label="GitHub repository"
        name="repoUrl"
        required={!isLocked}
        defaultValue={initial?.repoUrl ?? ""}
        placeholder="https://github.com/owner/repo"
        disabled={isLocked || pending}
        description="Required to submit. Must be a public github.com owner/repo URL."
      />

      <Field
        label="Merged pull request"
        name="prUrl"
        defaultValue={initial?.prUrl ?? ""}
        placeholder="https://github.com/owner/repo/pull/123"
        disabled={isLocked || pending}
        description="Optional. Include a merged PR URL for extra XP when approved."
      />

      <Field
        label="Live demo"
        name="liveDemoUrl"
        defaultValue={initial?.liveDemoUrl ?? ""}
        placeholder="https://…"
        disabled={isLocked || pending}
      />

      <Field
        label="Video demo"
        name="videoDemoUrl"
        defaultValue={initial?.videoDemoUrl ?? ""}
        placeholder="https://…"
        disabled={isLocked || pending}
      />

      <div>
        <label htmlFor="screenshotUrls" className="text-sm font-medium">
          Screenshot URLs
        </label>
        <textarea
          id="screenshotUrls"
          name="screenshotUrls"
          rows={3}
          defaultValue={(initial?.screenshotUrls ?? []).join("\n")}
          placeholder={"https://…/screenshot-1.png\nhttps://…/screenshot-2.png"}
          disabled={isLocked || pending}
          className={fieldClassName}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">One image URL per line.</p>
      </div>

      <div>
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initial?.notes ?? ""}
          placeholder="What to know when reviewing - setup quirks, demo account, stretch goals…"
          disabled={isLocked || pending}
          className={fieldClassName}
        />
      </div>

      {error ? (
        <p
          className="rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {message ? (
        <p
          className="rounded-none border border-border bg-transparent px-3 py-2 text-sm text-foreground"
          role="status"
        >
          {message}
        </p>
      ) : null}

      {isLocked ? (
        <p className="text-sm text-muted-foreground">
          This submission is locked while it is under review. You can revise it after a
          reviewer requests changes, or start a new one once it is approved or rejected.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="outline"
            loading={pending}
            formAction={run(saveProjectDraftAction, "Draft saved.")}
          >
            {pending ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="submit"
            loading={pending}
            formAction={run(submitProjectAction, "Submitted for review.")}
          >
            {pending ? "Submitting…" : "Submit for review"}
          </Button>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
  required,
  description,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type="url"
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className={fieldClassName}
      />
      {description ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
