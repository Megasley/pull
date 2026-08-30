import type { ReactNode } from "react";

/** Card-styled collapsible — same bordered-card language used throughout
 *  admin detail pages, for a sub-panel whose content can get long (a list
 *  of pull requests, an audit log) without competing for attention with the
 *  facts above it. Open by default. */
export function CollapsibleCard({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-none border border-border bg-card p-4" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="font-mono text-xs text-muted-foreground transition-transform group-open:rotate-90"
        >
          ▶
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
