"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

import { SiteContainer } from "@/components/layout/site-container";

/** Bump when the message changes so returning visitors see the new notice once. */
const STORAGE_KEY = "pull:beta-banner-dismissed-v2";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) !== "1";
}

function getServerSnapshot() {
  return false;
}

function dismissBanner() {
  window.localStorage.setItem(STORAGE_KEY, "1");
  listeners.forEach((listener) => listener());
}

export function BetaBanner() {
  const visible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!visible) {
    return null;
  }

  return (
    <div className="border-b border-ink/20 bg-signal/20">
      <SiteContainer className="flex items-center justify-between gap-3 py-2">
        <p className="font-mono text-[11px] leading-relaxed tracking-wide text-foreground">
          Public beta — curriculum under technical review. Spot an error?{" "}
          <a
            href="https://github.com/Megasley/pull/issues"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
          >
            Open an issue
          </a>
          .
        </p>
        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Dismiss beta notice"
          className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </SiteContainer>
    </div>
  );
}
