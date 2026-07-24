import { cn } from "@/lib/utils";

import { H2 } from "./typography";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  titleId?: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  align = "left",
  action,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        centered && "items-center text-center sm:items-center sm:justify-center",
        className,
      )}
    >
      <div className={cn("space-y-3", centered && "max-w-2xl")}>
        {eyebrow ? <p className="tech-eyebrow">{eyebrow}</p> : null}
        <H2 id={titleId} className={cn(centered && "mx-auto")}>
          {title}
        </H2>
        {description ? (
          <p
            className={cn(
              "max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base",
              centered && "mx-auto",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type SectionDividerProps = {
  label?: string;
  className?: string;
};

export function SectionDivider({ label, className }: SectionDividerProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-px flex-1 bg-border" />
      {label ? (
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
