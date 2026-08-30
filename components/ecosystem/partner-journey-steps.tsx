export type PartnerJourneyStep = {
  step: string;
  label: string;
  body: string;
};

type PartnerJourneyStepsProps = {
  steps: readonly PartnerJourneyStep[];
};

/** Numbered step progression — reused across partner pages for "How it works". */
export function PartnerJourneySteps({ steps }: PartnerJourneyStepsProps) {
  return (
    <div className="border border-border">
      <div className="flex flex-col lg:flex-row">
        {steps.map((stage, i) => (
          <div
            key={stage.step}
            className="flex flex-1 flex-col gap-4 border-b border-border p-6 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0"
          >
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-[11px] text-muted-foreground/50">
                {stage.step}
              </span>
              {i < steps.length - 1 ? (
                <span
                  className="ml-auto font-mono text-xs text-muted-foreground/30 lg:hidden"
                  aria-hidden
                >
                  ↓
                </span>
              ) : null}
            </div>
            <p className="font-mono text-xs font-bold tracking-widest text-foreground uppercase">
              {stage.label}
            </p>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              {stage.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
