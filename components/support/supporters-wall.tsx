import { Zap } from "lucide-react";

import { EmptyState } from "@/components/design-system";
import {
  formatDonationRelative,
  formatSats,
} from "@/lib/support/format";
import type { PublicSupporter } from "@/lib/support/repository";

type SupportersWallProps = {
  supporters: PublicSupporter[];
};

export function SupportersWall({ supporters }: SupportersWallProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="tech-eyebrow">community // wall</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Recent Supporters
        </h2>
        <p className="mt-2 max-w-2xl font-mono text-sm text-muted-foreground">
          Thank you to everyone helping keep Pull running.
        </p>
      </div>

      {supporters.length === 0 ? (
        <EmptyState
          icon={<Zap className="size-5" aria-hidden />}
          title="No public supporters yet"
          description="Be the first to support Pull and opt in to appear on this wall."
          actionLabel="Support with Bitcoin"
          actionHref="#donate"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {supporters.map((supporter) => (
            <li
              key={supporter.id}
              className="border border-border bg-background p-4 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-ink/20 bg-signal/15"
                  aria-hidden
                >
                  <Zap className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">
                    {supporter.displayName}
                  </p>
                  {supporter.showAmount && supporter.amountSats != null ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {formatSats(supporter.amountSats)}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    {formatDonationRelative(supporter.paidAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
