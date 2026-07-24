import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoadmapLockedBannerProps = {
  message: string;
  prerequisiteSlug: string;
  prerequisiteTitle: string;
  tone?: "locked" | "info";
  className?: string;
};

export function RoadmapLockedBanner({
  message,
  prerequisiteSlug,
  prerequisiteTitle,
  tone = "locked",
  className,
}: RoadmapLockedBannerProps) {
  const isLocked = tone === "locked";

  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex flex-col gap-4 rounded-none border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        isLocked
          ? "border-ink bg-ink text-[var(--background)]"
          : "border-ink/20 bg-signal/10 text-foreground",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-none border",
            isLocked
              ? "border-[var(--signal)]/40 bg-[var(--signal)] text-ink"
              : "border-ink/25 bg-signal text-ink",
          )}
        >
          <Lock className="size-4" aria-hidden />
        </span>
        <div>
          <p
            className={cn(
              "font-mono text-[11px] tracking-[0.12em] uppercase",
              isLocked ? "text-[var(--signal)]" : "text-ink",
            )}
          >
            {isLocked ? "access denied // locked" : "suggested path // prerequisite"}
          </p>
          <p
            className={cn(
              "mt-1 text-sm",
              isLocked ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {message}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        asChild
        variant={isLocked ? "default" : "outline"}
        className={cn(
          "h-auto w-full whitespace-normal px-3 py-2 sm:w-auto sm:shrink-0",
          isLocked &&
            "border-[var(--signal)] bg-[var(--signal)] text-ink hover:bg-[var(--signal)]/90",
        )}
      >
        <Link href={`/roadmaps/${prerequisiteSlug}`}>
          {isLocked
            ? `./unlock ${prerequisiteTitle.toLowerCase()}`
            : `./view ${prerequisiteTitle.toLowerCase()}`}
        </Link>
      </Button>
    </div>
  );
}
