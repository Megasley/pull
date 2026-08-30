import { cn } from "@/lib/utils";

export type HeroJourneyNode = {
  title: string;
  subtitle?: string;
};

type PartnerHeroJourneyProps = {
  nodes: readonly HeroJourneyNode[];
  className?: string;
};

/** Vertical node-and-arrow diagram — the visual spine of a partner hero section. */
export function PartnerHeroJourney({ nodes, className }: PartnerHeroJourneyProps) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-0">
        {nodes.map((node, i) => {
          const isLast = i === nodes.length - 1;

          return (
            <div key={node.title} className="flex flex-col items-center">
              <div
                className={cn(
                  "flex w-full min-w-[220px] flex-col items-center gap-1 border px-6 py-4 text-center",
                  isLast ? "border-ink bg-signal" : "border-ink bg-background",
                )}
              >
                <span className="font-mono text-xs font-bold tracking-[0.16em] uppercase">
                  {node.title}
                </span>
                {node.subtitle ? (
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      isLast ? "opacity-70" : "text-muted-foreground",
                    )}
                  >
                    {node.subtitle}
                  </span>
                ) : null}
              </div>
              {!isLast ? (
                <span className="py-1.5 font-mono text-sm text-[var(--signal)]" aria-hidden>
                  ↓
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
