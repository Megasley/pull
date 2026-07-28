import { cn } from "@/lib/utils";

type SegmentBarProps = {
  /** 0–100 strength percent mapped to 5 segments */
  percent: number;
  className?: string;
};

export function SegmentBar({ percent, className }: SegmentBarProps) {
  const filled = Math.max(0, Math.min(5, Math.round(percent / 20)));

  return (
    <div
      className={cn("profile-segbar", className)}
      role="img"
      aria-label={`${percent} percent strength`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={cn(index < filled && "profile-segbar-on")}
        />
      ))}
    </div>
  );
}
