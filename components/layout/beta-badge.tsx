import { cn } from "@/lib/utils";

type BetaBadgeProps = {
  className?: string;
};

/** Persistent product-stage marker — keep small and quiet. */
export function BetaBadge({ className }: BetaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-ink/25 bg-ink/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-[0.14em] text-ink/80 uppercase",
        className,
      )}
    >
      Beta
    </span>
  );
}
