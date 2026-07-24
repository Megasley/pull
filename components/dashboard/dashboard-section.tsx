import { cn } from "@/lib/utils";

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  action?: React.ReactNode;
};

export function DashboardSection({
  title,
  description,
  children,
  className,
  id,
  action,
}: DashboardSectionProps) {
  return (
    <section
      id={id}
      className={cn("space-y-4", className)}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id={id ? `${id}-title` : undefined}
            className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
