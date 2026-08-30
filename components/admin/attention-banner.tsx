import Link from "next/link";

export type AttentionItem = {
  label: string;
  detail?: string;
  href?: string;
  tone: "destructive" | "warning";
};

const TONE_CLASSES: Record<AttentionItem["tone"], string> = {
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-warning/40 bg-warning/10 text-warning",
};

/**
 * The one section every admin page in this build leads with — reserves
 * semantic color for things that actually need a look, instead of spreading
 * destructive/warning badges thinly across a wall of otherwise-neutral stat
 * cards. Renders a calm confirmation line when there's nothing to flag.
 */
export function AttentionBanner({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-6 flex items-center gap-2 border border-success/40 bg-success/10 px-3 py-2.5 font-mono text-xs text-success">
        <span aria-hidden>✓</span>
        <span>Nothing needs attention right now.</span>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {items.map((item, index) => {
        const content = (
          <>
            <span className="font-medium">{item.label}</span>
            {item.detail ? <span className="ml-2 text-muted-foreground">{item.detail}</span> : null}
          </>
        );
        const className = `flex items-center justify-between gap-3 border px-3 py-2.5 font-mono text-xs ${TONE_CLASSES[item.tone]}`;

        return item.href ? (
          <Link key={index} href={item.href} className={`${className} transition-opacity hover:opacity-80`}>
            {content}
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <div key={index} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
