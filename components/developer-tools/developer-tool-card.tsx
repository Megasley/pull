import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  DeveloperToolDifficultyBadge,
  DeveloperToolOpenSourceBadge,
  DeveloperToolSponsoredBadge,
} from "@/components/developer-tools/developer-tool-badge";
import { Button } from "@/components/ui/button";
import type { DeveloperTool } from "@/lib/developer-tools/types";
import { cn } from "@/lib/utils";

type DeveloperToolCardProps = {
  tool: DeveloperTool;
  className?: string;
};

export function DeveloperToolCard({ tool, className }: DeveloperToolCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col border border-border bg-background p-4 transition-colors hover:bg-muted/20",
        tool.featuredPartner && "border-ink/35",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-12 shrink-0 items-center justify-center border border-ink bg-signal font-mono text-xs font-bold text-ink"
          aria-hidden
        >
          {tool.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold tracking-tight">
              {tool.name}
            </h2>
            {tool.sponsored ? <DeveloperToolSponsoredBadge /> : null}
          </div>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {tool.category}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 font-mono text-xs leading-relaxed text-muted-foreground">
        {tool.description}
      </p>

      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        <span className="text-foreground/70">Build:</span> {tool.buildUseCase}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <DeveloperToolOpenSourceBadge openSource={tool.openSource} />
        <DeveloperToolDifficultyBadge difficulty={tool.difficulty} />
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
        <Button asChild size="sm" className="w-full sm:flex-1">
          <Link href={`/developer-tools/${tool.slug}`}>Build With This</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="w-full sm:flex-1">
          <a href={tool.docs} target="_blank" rel="noreferrer">
            Visit Docs
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </article>
  );
}
