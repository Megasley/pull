"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  isExternalHref,
  isNavComingSoon,
  isNavDivider,
  isNavLink,
  primaryNav,
  type NavGroupItem,
} from "@/lib/site-config";
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
        const groupActive = (item.items as readonly NavGroupItem[]).some(
          (child) => isNavLink(child) && isActivePath(pathname, child.href),
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
            <DropdownMenuContent align="start" className="min-w-52">
              {(item.items as readonly NavGroupItem[]).map((child, i) => {
                if (isNavDivider(child)) {
                  return <DropdownMenuSeparator key={`divider-${i}`} />;
                }

                if (isNavComingSoon(child)) {
                  return (
                    <div
                      key={child.title}
                      className="flex cursor-default items-center justify-between px-2 py-1.5 text-sm text-muted-foreground/60 select-none"
                      aria-disabled="true"
                    >
                      <span>{child.title}</span>
                      <span className="ml-4 border border-border/50 px-1.5 py-0.5 font-mono text-[9px] tracking-widest uppercase text-muted-foreground/50">
                        Soon
                      </span>
                    </div>
                  );
                }

                const active = isActivePath(pathname, child.href);
                const external =
                  isExternalHref(child.href) || Boolean(child.external);

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
                        <span className="ml-auto pl-2 opacity-40" aria-hidden>↗</span>
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
