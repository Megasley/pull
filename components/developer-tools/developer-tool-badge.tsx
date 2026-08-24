import { Badge } from "@/components/ui/badge";
import type { DeveloperToolDifficulty } from "@/lib/developer-tools/types";
import { cn } from "@/lib/utils";

const difficultyClassName: Record<DeveloperToolDifficulty, string> = {
  Beginner: "border-ink/20 bg-signal text-ink",
  Intermediate: "border-ink/30 bg-ink/10 text-ink",
  Advanced: "border-ink bg-ink text-[var(--background)]",
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
