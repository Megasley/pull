"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type OrganizationClaimButtonProps = {
  organizationName: string;
};

export function OrganizationClaimButton({
  organizationName,
}: OrganizationClaimButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Claim Organization
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md border border-border bg-background p-5 shadow-[var(--shadow-off-sm)]"
          >
            <p className="tech-eyebrow">organizations // claim</p>
            <h2
              id={titleId}
              className="mt-2 text-xl font-bold tracking-[-0.03em]"
            >
              Claim {organizationName}
            </h2>
            <p
              id={descriptionId}
              className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground"
            >
              Claim flow coming soon. When ready, maintainers will verify
              ownership and unlock content management and contributor resources
              on Pull.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" disabled>
                Start claim (soon)
              </Button>
              <Button
                ref={closeRef}
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
