"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type TermProps = {
  /** Plain-language definition, one or two sentences. */
  def: string;
  children: ReactNode;
};

/**
 * A key word with a tap-to-open definition, so readers never get stuck on
 * jargon. <Term def="A waiting room for unconfirmed transactions.">mempool</Term>
 */
export function Term({ def, children }: TermProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="cursor-help border-b border-dashed border-ink/60 font-medium text-foreground transition-colors hover:border-ink hover:bg-signal/25"
      >
        {children}
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="ix-row-enter absolute bottom-full left-1/2 z-20 mb-2 block w-64 max-w-[80vw] -translate-x-1/2 border border-ink bg-card px-3 py-2 text-left text-[13px] leading-relaxed font-normal text-foreground shadow-[var(--shadow-off-sm)]"
        >
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink">
            {children}
          </span>
          {def}
        </span>
      ) : null}
    </span>
  );
}
