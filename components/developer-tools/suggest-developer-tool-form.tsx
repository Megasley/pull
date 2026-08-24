"use client";

import { useRef, useState, useTransition } from "react";

import { suggestDeveloperToolAction } from "@/app/actions/developer-tools";
import { Button } from "@/components/ui/button";
import { DEVELOPER_TOOL_CATEGORIES } from "@/lib/developer-tools";
import { cn } from "@/lib/utils";

const fieldClassName =
  "mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SuggestDeveloperToolForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="relative space-y-5"
      action={(formData) => {
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const result = await suggestDeveloperToolAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage("Thanks — we received your suggestion and will review it soon.");
          formRef.current?.reset();
        });
      }}
    >
      {/* Honeypot — hidden from humans */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="toolName" className="text-sm font-medium">
            Tool name
          </label>
          <input
            id="toolName"
            name="toolName"
            required
            maxLength={120}
            disabled={pending}
            placeholder="e.g. Blink"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="website" className="text-sm font-medium">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            required
            disabled={pending}
            placeholder="https://"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="docs" className="text-sm font-medium">
            Docs <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="docs"
            name="docs"
            type="url"
            disabled={pending}
            placeholder="https://"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="github" className="text-sm font-medium">
            GitHub <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="github"
            name="github"
            type="url"
            disabled={pending}
            placeholder="https://github.com/…"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            disabled={pending}
            defaultValue=""
            className={cn(fieldClassName, "bg-background")}
          >
            <option value="" disabled>
              Select…
            </option>
            {DEVELOPER_TOOL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="buildUseCase" className="text-sm font-medium">
            Build use case <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="buildUseCase"
            name="buildUseCase"
            maxLength={120}
            disabled={pending}
            placeholder="e.g. Lightning Wallets, Merchant Checkout"
            className={fieldClassName}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="why" className="text-sm font-medium">
            Why should we add it?
          </label>
          <textarea
            id="why"
            name="why"
            required
            rows={4}
            maxLength={1000}
            disabled={pending}
            placeholder="Who it helps, what builders can ship with it, and why it fits Pull…"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="submitterName" className="text-sm font-medium">
            Your name <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="submitterName"
            name="submitterName"
            maxLength={120}
            disabled={pending}
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="submitterEmail" className="text-sm font-medium">
            Your email
          </label>
          <input
            id="submitterEmail"
            name="submitterEmail"
            type="email"
            required
            disabled={pending}
            placeholder="you@example.com"
            className={fieldClassName}
          />
        </div>
      </div>

      {error ? (
        <p className="font-mono text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="font-mono text-xs text-foreground" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          Submit suggestion
        </Button>
        <p className="font-mono text-[11px] text-muted-foreground">
          Reviewed by maintainers — not published automatically.
        </p>
      </div>
    </form>
  );
}
