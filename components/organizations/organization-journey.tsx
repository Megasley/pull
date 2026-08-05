"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { OrganizationSection } from "@/components/organizations/organization-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrganizationProfile } from "@/lib/organizations/types";
import { isExternalHref } from "@/lib/site-config";

type OrganizationJourneyProps = {
  organization: OrganizationProfile;
};

export function OrganizationJourney({ organization }: OrganizationJourneyProps) {
  const stages = organization.journey;
  if (stages.length === 0) return null;

  return (
    <OrganizationSection
      id="journey"
      eyebrow="contribute // journey"
      title="Contributor journey"
      description={`A staged path from foundations to protocol depth — designed so ${organization.name} and Pull meet builders where they are.`}
    >
      <Tabs defaultValue={stages[0]?.id} className="gap-6">
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b border-border bg-transparent p-0"
        >
          {stages.map((stage) => (
            <TabsTrigger
              key={stage.id}
              value={stage.id}
              className="rounded-none border-0 px-4 py-3 font-mono text-[11px] tracking-[0.12em] uppercase data-active:bg-transparent data-active:text-foreground"
            >
              {stage.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {stages.map((stage, stageIndex) => (
          <TabsContent key={stage.id} value={stage.id} className="mt-0 outline-none">
            <p className="mb-6 max-w-2xl font-mono text-sm text-muted-foreground">
              {stage.summary}
            </p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {stage.steps.map((step, stepIndex) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                        Step {stageIndex * 4 + stepIndex + 1}
                      </span>
                      {step.href ? (
                        <ArrowUpRight
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </>
                );

                const className =
                  "block h-full border border-border bg-background p-4 transition-colors hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

                if (!step.href) {
                  return (
                    <li key={step.title}>
                      <div className={className}>{content}</div>
                    </li>
                  );
                }

                const external = isExternalHref(step.href);
                return (
                  <li key={step.title}>
                    {external ? (
                      <a
                        href={step.href}
                        target="_blank"
                        rel="noreferrer"
                        className={className}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link href={step.href} className={className}>
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </TabsContent>
        ))}
      </Tabs>
    </OrganizationSection>
  );
}
