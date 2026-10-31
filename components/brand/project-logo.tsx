import Image from "next/image";

import { cn } from "@/lib/utils";

type ProjectLogoProps = {
  /** Local logo path, e.g. /logos/tools/alby.png. */
  src?: string;
  /** Initials shown when there is no logo. */
  fallback?: string;
  /** Sets the tile size, e.g. "size-12". */
  className?: string;
  /** Pixel size hint for next/image. */
  sizes?: string;
};

/** Square project logo tile; falls back to the brand initials tile. */
export function ProjectLogo({
  src,
  fallback,
  className,
  sizes = "96px",
}: ProjectLogoProps) {
  if (!src) {
    return fallback ? (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-ink bg-signal font-mono text-xs font-bold text-signal-foreground",
          className,
        )}
        aria-hidden
      >
        {fallback}
      </div>
    ) : null;
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-border bg-white",
        className,
      )}
      aria-hidden
    >
      <Image src={src} alt="" fill sizes={sizes} className="object-contain p-0.5" />
    </div>
  );
}
