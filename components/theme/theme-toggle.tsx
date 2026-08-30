"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

/** True only after hydration, so the icon isn't guessed during SSR. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

type ThemeToggleProps = {
  className?: string;
};

/**
 * Compact toggle for logged-out visitors on public/marketing pages, who
 * have no Settings page to reach — signed-in users set this from Settings
 * → Profile → Appearance instead (a fuller System/Light/Dark control). See
 * components/layout/navbar.tsx and mobile-nav.tsx for where this is
 * conditionally shown only when there's no session.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex size-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      {isDark ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
    </button>
  );
}
