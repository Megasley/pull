import { Reveal, RevealStagger } from "@/components/landing/reveal";
import { SiteContainer } from "@/components/layout/site-container";

const AUDIENCES = [
  {
    id: "01",
    title: "First-time contributors",
    description:
      "Developers making their first open source contribution with a clear path to follow.",
  },
  {
    id: "02",
    title: "Bitcoin & Lightning builders",
    description:
      "Protocol-curious developers building practical skills across both ecosystems.",
  },
  {
    id: "03",
    title: "Bootcamp graduates",
    description:
      "Developers ready to turn coursework into software, reviews, and upstream work.",
  },
  {
    id: "04",
    title: "Public portfolio builders",
    description:
      "Developers who want verifiable proof of what they learned, built, and contributed.",
  },
] as const;

export function AudienceSection() {
  return (
    <section
      aria-labelledby="audience-heading"
      className="border-b border-border bg-muted/20"
    >
      <SiteContainer className="py-16 sm:py-20">
        <Reveal variant="clip">
          <p className="tech-eyebrow">users // who pull is for</p>
        </Reveal>
        <Reveal variant="up" delayMs={80}>
          <h2
            id="audience-heading"
            className="mt-3 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em]"
          >
            For developers ready to build in public
          </h2>
        </Reveal>

        <RevealStagger
          className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
          itemClassName="h-full bg-background"
          variant="up"
          stepMs={90}
        >
          {AUDIENCES.map((audience) => (
            <div
              key={audience.id}
              className="h-full bg-background px-5 py-6 transition-colors hover:bg-muted/40"
            >
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                usr.{audience.id}
              </p>
              <h3 className="mt-4 text-lg font-bold tracking-[-0.03em]">
                {audience.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {audience.description}
              </p>
            </div>
          ))}
        </RevealStagger>
      </SiteContainer>
    </section>
  );
}
