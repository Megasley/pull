import { SegmentBar } from "@/components/profile/segment-bar";
import { cn } from "@/lib/utils";
import type {
  BuilderScoreFactor,
  BuilderScoreResult,
  BuilderScoreStrength,
} from "@/types/score";

const STRENGTH_LABEL: Record<BuilderScoreStrength, string> = {
  emerging: "Emerging",
  building: "Building",
  strong: "Strong",
  exceptional: "Exceptional",
};

type BuilderScorePanelProps = {
  score: BuilderScoreResult;
  className?: string;
  compact?: boolean;
  variant?: "default" | "profile";
  summaryText?: string;
};

export function BuilderScorePanel({
  score,
  className,
  compact = false,
  variant = "default",
  summaryText,
}: BuilderScorePanelProps) {
  const isProfile = variant === "profile";

  return (
    <div
      className={cn(
        isProfile
          ? "profile-score-card"
          : "rounded-none border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          <ScoreRing value={score.score} variant={variant} accent={false} />
          <div className="min-w-0">
            <p
              className={cn(
                isProfile
                  ? "text-[15px] font-bold text-foreground"
                  : "text-sm text-muted-foreground",
              )}
            >
              {isProfile ? (
                <>Builder Score — {score.score}/100</>
              ) : (
                "Builder Score"
              )}
            </p>
            {!isProfile ? (
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {score.score}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  / 100
                </span>
              </p>
            ) : null}
            <p
              className={cn(
                isProfile
                  ? "mt-1 text-[13px] leading-relaxed text-muted-foreground"
                  : compact
                    ? "hidden"
                    : "mt-2 max-w-md text-sm text-muted-foreground",
              )}
            >
              {summaryText ?? score.summary}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-6 grid gap-3",
          compact || isProfile ? "sm:grid-cols-2" : "md:grid-cols-2",
        )}
      >
        {score.factors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} variant={variant} />
        ))}
      </div>

      {!compact && !isProfile ? (
        <p className="mt-5 text-xs text-muted-foreground">
          Builder Score measures what you build and verify - completed projects,
          approvals, roadmaps, open source work, community reviews, and recent
          consistency. Weighting can evolve as Pull grows; your score stays
          comparable over time within each scoring era.
        </p>
      ) : null}
    </div>
  );
}

function ScoreRing({
  value,
  variant,
  accent,
}: {
  value: number;
  variant: "default" | "profile";
  accent: boolean;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const isProfile = variant === "profile";
  const center = isProfile ? 42 : 44;
  const strokeWidth = isProfile ? 9 : 6;

  return (
    <div
      className={cn("relative shrink-0", isProfile ? "size-[84px]" : "size-20")}
      role="img"
      aria-label={`Builder Score ${value} out of 100`}
    >
      <svg
        className="size-full -rotate-90"
        viewBox={isProfile ? "0 0 84 84" : "0 0 88 88"}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={accent ? "var(--signal)" : "currentColor"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            !accent && "text-foreground",
            "transition-[stroke-dashoffset] duration-700 ease-out",
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold tabular-nums",
          isProfile ? "text-[22px]" : "text-lg font-semibold",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FactorRow({
  factor,
  variant,
}: {
  factor: BuilderScoreFactor;
  variant: "default" | "profile";
}) {
  const isProfile = variant === "profile";

  return (
    <div
      className={cn(
        isProfile
          ? "profile-mini-card"
          : "rounded-none border border-border bg-transparent px-3.5 py-3",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn(isProfile ? "text-[13px] font-bold" : "text-sm font-medium")}>
            {factor.label}
          </p>
          <p
            className={cn(
              isProfile
                ? "mt-1 text-[11.5px] leading-snug text-muted-foreground"
                : "mt-0.5 text-xs text-muted-foreground",
            )}
          >
            {factor.description}
          </p>
        </div>
        <span
          className={cn(
            isProfile
              ? cn(
                  "profile-mini-tag",
                  factor.strength === "emerging"
                    ? "profile-mini-tag-emerging"
                    : "profile-mini-tag-building",
                )
              : "shrink-0 rounded-none border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
          )}
        >
          {STRENGTH_LABEL[factor.strength]}
        </span>
      </div>
      {isProfile ? (
        <SegmentBar percent={factor.strengthPercent} className="mt-2" />
      ) : (
        <div className="mt-3 h-1.5 overflow-hidden rounded-none bg-muted/60">
          <div
            className="h-full rounded-none bg-foreground/80 transition-[width] duration-700 ease-out"
            style={{ width: `${factor.strengthPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
