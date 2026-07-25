"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/** Bump when the message changes so returning visitors see the new notice once. */
const STORAGE_KEY = "pull:beta-banner-dismissed-v2";

export function BetaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="border-b border-ink/20 bg-signal/20">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
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
          onClick={dismiss}
          aria-label="Dismiss beta notice"
          className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
