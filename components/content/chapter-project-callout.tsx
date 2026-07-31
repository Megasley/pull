import Link from "next/link";
import { Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChapterProjectCalloutProps = {
  projectSlugs: string[];
  className?: string;
};

const PROJECT_LABELS: Record<string, string> = {
  "lightning-pos": "Lightning POS",
  "ln-node-dashboard": "Node Ops Dashboard",
  "custom-router": "Custom Router",
};

export function ChapterProjectCallout({
  projectSlugs,
  className,
}: ChapterProjectCalloutProps) {
  if (projectSlugs.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-none border border-ink/20 bg-signal/10 p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Hammer className="mt-0.5 size-5 shrink-0 text-ink" />
        <div className="space-y-4">
          <div>
            <p className="tech-eyebrow text-foreground">build // next</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Apply this chapter in a project
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You have the concepts — ship something small to prove it. These
              Pull projects connect directly to what you just studied.
            </p>
          </div>

          <ul className="space-y-3">
            {projectSlugs.map((slug) => (
              <li
                key={slug}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="font-mono text-xs text-foreground">
                    project // {slug}
                  </p>
                  {PROJECT_LABELS[slug] ? (
                    <Badge variant="outline" className="text-[10px]">
                      {PROJECT_LABELS[slug]}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${slug}`}>./spec</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/projects/${slug}/submit`}>./submit</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
