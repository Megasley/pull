"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function isInternalNavigation(href: string, pathname: string): boolean {
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      return false;
    }

    const next = `${url.pathname}${url.search}`;
    const current = `${pathname}${window.location.search}`;
    return next !== current;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [active, setActive] = useState(false);
  const [routeWhenActive, setRouteWhenActive] = useState(routeKey);

  // Clear the bar once the route has changed (adjust state during render).
  if (active && routeWhenActive !== routeKey) {
    setActive(false);
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalNavigation(href, pathname)) return;

      setRouteWhenActive(routeKey);
      setActive(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, routeKey]);

  if (!active) {
    return null;
  }

  return (
    <div
      className="nav-progress-bar"
      role="progressbar"
      aria-label="Loading page"
      aria-busy="true"
    />
  );
}

export function PageLoadingIndicator({ label = "Loading page" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div
        className="flex flex-col items-center gap-4 text-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex size-12 items-center justify-center border border-ink bg-background shadow-[var(--shadow-off-sm)]">
          <Loader2 className="size-5 animate-spin text-ink" aria-hidden />
        </div>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </p>
      </div>
    </div>
  );
}
