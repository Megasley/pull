import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: string;
  actions?: React.ReactNode;
  className?: string;
  titleId?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
  titleId,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        <p className="tech-eyebrow">{eyebrow}</p>
        <h1
          id={titleId}
          className="mt-3 text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.04em] text-balance"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            {meta}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap gap-2 lg:w-auto lg:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
