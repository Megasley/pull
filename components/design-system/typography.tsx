import { cn } from "@/lib/utils";

export const H1 = ({ className, ...props }: React.ComponentProps<"h1">) => (
  <h1
    className={cn(
      "text-[clamp(2rem,8vw,3.75rem)] font-bold tracking-[-0.04em] break-words text-balance",
      className,
    )}
    {...props}
  />
);

export const H2 = ({ className, ...props }: React.ComponentProps<"h2">) => (
  <h2
    className={cn(
      "text-[clamp(1.75rem,6vw,2.25rem)] font-bold tracking-[-0.03em] break-words text-balance",
      className,
    )}
    {...props}
  />
);

export const H3 = ({ className, ...props }: React.ComponentProps<"h3">) => (
  <h3
    className={cn(
      "text-[clamp(1.35rem,4.5vw,1.875rem)] font-semibold tracking-[-0.02em] break-words",
      className,
    )}
    {...props}
  />
);

export const H4 = ({ className, ...props }: React.ComponentProps<"h4">) => (
  <h4
    className={cn(
      "text-lg font-semibold tracking-[-0.02em] sm:text-xl",
      className,
    )}
    {...props}
  />
);

export const Lead = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p
    className={cn(
      "text-lg leading-snug tracking-[-0.02em] text-balance sm:text-xl",
      className,
    )}
    {...props}
  />
);

export const Muted = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);

export const Eyebrow = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span className={cn("tech-eyebrow", className)} {...props} />
);

export const Label = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span className={cn("tech-eyebrow", className)} {...props} />
);

export const Code = ({ className, ...props }: React.ComponentProps<"code">) => (
  <code
    className={cn(
      "rounded-none border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
      className,
    )}
    {...props}
  />
);

export const Prose = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={cn(
      "space-y-4 text-base leading-7 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground",
      className,
    )}
    {...props}
  />
);
