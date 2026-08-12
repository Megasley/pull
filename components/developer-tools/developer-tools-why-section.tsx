const JOURNEY = ["Learn", "Build", "Contribute", "Prove"] as const;

export function DeveloperToolsWhySection() {
  return (
    <section
      aria-labelledby="why-developer-tools-heading"
      className="border-y border-border py-10"
    >
      <p className="tech-eyebrow">context // pull</p>
      <h2
        id="why-developer-tools-heading"
        className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl"
      >
        Why Developer Tools?
      </h2>
      <div className="mt-4 max-w-2xl space-y-4">
        <p className="text-base font-medium tracking-tight text-foreground sm:text-lg">
          The best way to learn is to build.
        </p>
        <p className="font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
          These tools help developers move from learning to building, contributing, and
          proving their skills through real-world projects.
        </p>
      </div>

      <ol className="mt-8 flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase sm:gap-3 sm:text-xs">
        {JOURNEY.map((step, index) => (
          <li key={step} className="flex items-center gap-2 sm:gap-3">
            <span className="border border-border bg-background px-2.5 py-1.5 text-foreground">
              {step}
            </span>
            {index < JOURNEY.length - 1 ? (
              <span aria-hidden className="text-muted-foreground/70">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
