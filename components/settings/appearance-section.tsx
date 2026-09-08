"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

/** True only after hydration, so the selection isn't guessed during SSR. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

/**
 * Theme preference now lives here instead of the navbar — see the profile
 * settings page. Persisted client-side by next-themes (localStorage), same
 * as before; this just changes where it's set, not how.
 */
export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();
  const active = mounted ? (theme ?? "system") : "system";

  return (
    <fieldset className="space-y-3 border border-border border-l-4 border-l-ink/25 p-4">
      <legend className="tech-eyebrow px-1 text-foreground/80">Appearance</legend>
      <p className="text-xs text-muted-foreground">
        Choose light or dark, or follow your system setting automatically.
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active === option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "rounded-none border px-3 py-2 text-sm transition-colors",
              active === option.value
                ? "border-ink/25 bg-signal/15"
                : "border-border hover:border-foreground/40",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
