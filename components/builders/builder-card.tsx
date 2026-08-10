import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { lookingForLabel, type LookingForId } from "@/lib/builders/looking-for";
import type { BuilderDirectoryCard } from "@/lib/builders/directory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuilderCardProps = {
  builder: BuilderDirectoryCard;
  className?: string;
  compact?: boolean;
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function truncateBio(bio: string, max = 110) {
  const trimmed = bio.trim();
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function LookingForBadge({ id }: { id: LookingForId }) {
  if (id === "not_actively_looking") return null;
  return (
    <span className="border border-ink/20 bg-signal/15 px-2 py-0.5 font-mono text-[10px] tracking-wide text-foreground uppercase">
      {lookingForLabel(id)}
    </span>
  );
}

export function BuilderCard({ builder, className, compact }: BuilderCardProps) {
  const lookingBadges = builder.lookingFor.filter(
    (id) => id !== "not_actively_looking",
  );
  const bio = truncateBio(builder.bio, compact ? 80 : 110);
  const githubUrl = builder.githubUsername
    ? `https://github.com/${builder.githubUsername}`
    : null;

  return (
    <article
      className={cn(
        "flex h-full flex-col border border-border bg-background p-4 transition-colors hover:bg-muted/20",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-12 shrink-0 rounded-none border border-border">
          {builder.avatar ? (
            <AvatarImage src={builder.avatar} alt={builder.displayName} />
          ) : null}
          <AvatarFallback className="rounded-none bg-signal/20 font-mono text-xs">
            {initialsFor(builder.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight">
              {builder.displayName}
            </h3>
            {builder.activeRecently ? (
              <span className="shrink-0 border border-ink/20 bg-signal/20 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-foreground uppercase">
                Active this week
              </span>
            ) : null}
          </div>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            @{builder.username}
          </p>
        </div>
      </div>

      {bio ? (
        <p className="mt-3 text-sm leading-snug text-muted-foreground">{bio}</p>
      ) : null}

      {lookingBadges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lookingBadges.slice(0, compact ? 2 : 3).map((id) => (
            <LookingForBadge key={id} id={id} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 border border-border px-2 py-1.5 font-mono text-[11px]">
        <p className="text-muted-foreground uppercase tracking-wide">OSS reputation</p>
        <p className="mt-0.5 text-sm font-bold text-foreground">
          {builder.ossReputation}
        </p>
      </div>

      {!compact ? (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          {builder.mergedPullRequests} merged PRs · {builder.roadmapStatus}
        </p>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          {builder.mergedPullRequests} merged PRs
        </p>
      )}

      {builder.skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {builder.skills.slice(0, compact ? 3 : 5).map((skill) => (
            <span
              key={skill}
              className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/u/${builder.username}`}>View Profile</Link>
        </Button>
        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            GitHub
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}
