"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border border-ink bg-clip-padding",
    "font-mono text-[12.5px] font-bold tracking-normal whitespace-nowrap normal-case",
    "shadow-[var(--shadow-off-sm)] outline-none select-none",
    "transition-[transform,box-shadow,background-color,color] duration-100",
    "hover:-translate-x-px hover:-translate-y-px",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
    "disabled:pointer-events-none disabled:translate-0 disabled:opacity-50 disabled:shadow-none",
    "data-[loading=true]:pointer-events-none data-[loading=true]:translate-0 data-[loading=true]:opacity-100",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-background hover:bg-ink/90",
        outline: "border-ink bg-background text-foreground hover:bg-muted/40",
        secondary:
          "border-ink bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        ghost:
          "border-ink/30 bg-transparent text-foreground shadow-none hover:border-ink hover:bg-background hover:shadow-[var(--shadow-off-sm)]",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive shadow-[3px_3px_0_color-mix(in_oklab,var(--destructive)_55%,var(--ink))] hover:bg-destructive/20 focus-visible:outline-destructive/40",
        link: "h-auto border-0 bg-transparent p-0 font-medium text-primary shadow-none hover:translate-0 hover:underline hover:underline-offset-4 focus-visible:outline-signal",
      },
      size: {
        default:
          "h-auto min-h-9 px-3.5 py-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-auto min-h-6 gap-1 px-2 py-1 text-[11px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-auto min-h-8 gap-1 px-3 py-2 text-[11.5px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-auto min-h-11 gap-2 px-5 py-3 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9 min-h-9 p-0",
        "icon-xs": "size-6 min-h-6 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 min-h-8 p-0",
        "icon-lg": "size-10 min-h-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("size-3.5 shrink-0 animate-spin", className)} aria-hidden />
  );
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  onClick,
  type = "button",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const { pending: formPending } = useFormStatus();
  const [clickPending, setClickPending] = React.useState(false);

  const isSubmit = type === "submit";
  const isLoading = Boolean(loading || clickPending || (isSubmit && formPending));
  const isDisabled = Boolean(disabled || isLoading);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return;

    const result = onClick(event) as unknown;
    if (
      result != null &&
      typeof result === "object" &&
      "then" in (result as PromiseLike<unknown>)
    ) {
      setClickPending(true);
      try {
        await (result as PromiseLike<unknown>);
      } finally {
        setClickPending(false);
      }
    }
  };

  const sharedClassName = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-loading={isLoading ? "true" : undefined}
        aria-busy={isLoading || undefined}
        className={sharedClassName}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={isLoading ? "true" : undefined}
      aria-busy={isLoading || undefined}
      className={sharedClassName}
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
