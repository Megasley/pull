import { cn } from "@/lib/utils";

type FoundingSponsorRecognitionProps = {
  name: string;
  year: number;
  recognitionLabel?: string;
  /** Path to a logo image rendered in place of the text name. */
  logoSrc?: string;
  className?: string;
};

export function FoundingSponsorRecognition({
  name,
  year,
  recognitionLabel = "Founding Sponsor",
  logoSrc,
  className,
}: FoundingSponsorRecognitionProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 border-2 border-ink px-8 py-10 text-center",
        className,
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {recognitionLabel}
      </p>
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={name}
          className="h-5 w-auto dark:invert"
        />
      ) : (
        <p className="text-2xl font-bold tracking-[-0.03em]">{name}</p>
      )}
      <div className="h-px w-12 bg-border" />
      <p className="font-mono text-sm text-muted-foreground">{year}</p>
    </div>
  );
}
