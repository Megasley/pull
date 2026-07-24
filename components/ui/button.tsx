"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding font-mono text-sm font-medium tracking-wide whitespace-nowrap uppercase transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 data-[loading=true]:pointer-events-none data-[loading=true]:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "normal-case tracking-normal text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2 text-[11px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 text-[0.75rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-[0.85rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
    <Loader2
      className={cn("size-4 shrink-0 animate-spin", className)}
      aria-hidden
    />
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
  const isLoading = Boolean(
    loading || clickPending || (isSubmit && formPending),
  );
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
