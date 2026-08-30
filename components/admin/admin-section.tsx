import type { ReactNode } from "react";

type AdminSectionProps = {
  id: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Standard, always-expanded section wrapper — scroll-margin lines it up
 *  under the sticky AdminSectionNav. */
export function AdminSection({ id, title, description, actions, children }: AdminSectionProps) {
  return (
    <section id={id} className="mt-12 scroll-mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl font-mono text-[11px] text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Same header treatment, but collapsible via native <details> — for content
 *  that's useful but shouldn't compete for attention with the sections
 *  above it (long lists, secondary breakdowns). Open by default: collapsing
 *  is the admin's choice to make, not the page's. */
export function AdminDetailsSection({
  id,
  title,
  description,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} className="group mt-12 scroll-mt-16" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="font-mono text-xs text-muted-foreground transition-transform group-open:rotate-90"
        >
          ▶
        </span>
        <span>
          <h2 className="inline text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </summary>
      <div className="mt-4 pl-5">{children}</div>
    </details>
  );
}
