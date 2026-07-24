export function RoadmapLegend({ className }: { className?: string }) {
  return (
    <div className={className} aria-label="Roadmap legend">
      <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 border border-ink bg-signal" />
          Milestone
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 border border-border bg-transparent" />
          Topic
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-3 items-center justify-center border border-ink bg-signal">
            <span className="size-1 bg-ink" />
          </span>
          Done
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-3 items-center justify-center border border-border bg-muted/40">
            <span className="size-1.5 bg-muted-foreground/80" />
          </span>
          Locked
        </span>
      </div>
    </div>
  );
}
