"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isExternalHref, primaryNav } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (isExternalHref(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return cn(
    "rounded-none px-3 py-2 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    active
      ? "bg-ink text-[var(--background)]"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="hidden items-center gap-0.5 md:flex">
      {primaryNav.map((item) => {
        if (item.type === "link") {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              {item.title}
            </Link>
          );
        }

        const groupActive = item.items.some((child) =>
          isActivePath(pathname, child.href),
        );

        return (
          <DropdownMenu key={item.title}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto gap-1 px-3 py-2 text-[11px] tracking-[0.12em]",
                  groupActive
                    ? "bg-ink text-[var(--background)] hover:bg-ink hover:text-[var(--background)]"
                    : "text-muted-foreground",
                )}
                aria-current={groupActive ? "true" : undefined}
              >
                {item.title}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              {item.items.map((child) => {
                const active = isActivePath(pathname, child.href);
                const external =
                  isExternalHref(child.href) ||
                  ("external" in child && Boolean(child.external));

                return (
                  <DropdownMenuItem key={child.href} asChild>
                    {external ? (
                      <a
                        href={child.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(active && "bg-accent")}
                      >
                        {child.title}
                      </a>
                    ) : (
                      <Link
                        href={child.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(active && "bg-accent")}
                      >
                        {child.title}
                      </Link>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
