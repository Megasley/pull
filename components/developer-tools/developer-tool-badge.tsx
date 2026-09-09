import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_BADGE_CLASS } from "@/lib/design/difficulty-color";
import type { DeveloperToolDifficulty } from "@/lib/developer-tools/types";
import { cn } from "@/lib/utils";

/** DeveloperToolDifficulty is capitalized ("Beginner"), unlike the shared
 *  RoadmapDifficulty ("beginner") DIFFICULTY_BADGE_CLASS is keyed by — map
 *  onto the shared palette rather than keeping a second copy of the colors. */
const difficultyClassName: Record<DeveloperToolDifficulty, string> = {
  Beginner: DIFFICULTY_BADGE_CLASS.beginner,
  Intermediate: DIFFICULTY_BADGE_CLASS.intermediate,
  Advanced: DIFFICULTY_BADGE_CLASS.advanced,
};

export function DeveloperToolBadge({
  children,
  className,
  variant = "outline",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "outline" | "signal" | "muted";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        variant === "signal" && "border-ink/20 bg-signal/40 text-ink",
        variant === "muted" && "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function DeveloperToolOpenSourceBadge({ openSource }: { openSource: boolean }) {
  return (
    <DeveloperToolBadge variant={openSource ? "signal" : "muted"}>
      {openSource ? "Open Source" : "Proprietary"}
    </DeveloperToolBadge>
  );
}

export function DeveloperToolDifficultyBadge({
  difficulty,
}: {
  difficulty: DeveloperToolDifficulty;
}) {
  return <Badge className={difficultyClassName[difficulty]}>{difficulty}</Badge>;
}

export function DeveloperToolSponsoredBadge() {
  return (
    <DeveloperToolBadge
      variant="muted"
      className="font-normal normal-case tracking-normal"
    >
      Sponsored
    </DeveloperToolBadge>
  );
}
