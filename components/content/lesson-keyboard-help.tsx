"use client";

import { ExternalLink, X } from "lucide-react";

import { cn } from "@/lib/utils";

type LessonKeyboardHelpProps = {
  open: boolean;
  onClose: () => void;
  researchUrl?: string | null;
  researchQuery?: string;
  canToggleComplete?: boolean;
};

const baseShortcuts = [
  { keys: ["J", "N"], description: "Next lesson" },
  { keys: ["K", "P"], description: "Previous lesson" },
  { keys: ["C"], description: "Toggle lesson completion", requiresAuth: true },
  { keys: ["R"], description: "Research on Bitcoin Search" },
  { keys: ["Shift", "?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close shortcuts panel" },
] as const;

export function LessonKeyboardHelp({
  open,
  onClose,
  researchUrl,
  researchQuery,
  canToggleComplete = true,
}: LessonKeyboardHelpProps) {
  if (!open) {
    return null;
  }

  const shortcuts = baseShortcuts.filter(
    (shortcut) =>
      !("requiresAuth" in shortcut && shortcut.requiresAuth) || canToggleComplete,
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close keyboard shortcuts"
        className="absolute inset-0 bg-background/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-shortcuts-title"
        className={cn(
          "relative w-full max-w-md rounded-none border border-border bg-card p-6",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="lesson-shortcuts-title" className="text-lg font-semibold">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-none p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="space-y-3">
          {shortcuts.map((shortcut) => (
            <li
              key={shortcut.description}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">{shortcut.description}</span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded-none border border-border bg-muted/50 px-2 py-1 font-mono text-xs text-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>

        {researchUrl ? (
          <a
            href={researchUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex items-center justify-between gap-3 border border-border bg-muted/40 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="block font-medium text-foreground">
                Research on Bitcoin Search
              </span>
              {researchQuery ? (
                <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                  {researchQuery}
                </span>
              ) : null}
            </span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
