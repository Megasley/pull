import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils";

/** Shared max width + horizontal padding for navbar, pages, and marketing sections. */
export const siteContainerClassName =
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

type SiteContainerProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function SiteContainer<T extends ElementType = "div">({
  as,
  className,
  children,
  ...props
}: SiteContainerProps<T>) {
  const Tag = as ?? "div";

  return (
    <Tag className={cn(siteContainerClassName, className)} {...props}>
      {children}
    </Tag>
  );
}
