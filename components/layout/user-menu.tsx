"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, UserRound } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { accountNavSections, isExternalHref } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { BuilderProfile } from "@/types/user";

function isActivePath(pathname: string, href: string) {
  if (isExternalHref(href)) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type UserMenuProps = {
  profile: BuilderProfile | null;
  displayName: string;
  avatarUrl: string | null;
  orgMembership?: { slug: string; name: string } | null;
};

export function UserMenu({
  profile,
  displayName,
  avatarUrl,
  orgMembership,
}: UserMenuProps) {
  const pathname = usePathname();
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-none border border-border"
          aria-label="Open account menu"
        >
          <Avatar className="size-7 rounded-none">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="rounded-none font-mono text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal normal-case tracking-normal">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs font-medium tracking-wide uppercase">
              {displayName}
            </span>
            {profile ? (
              <span className="font-mono text-[11px] text-muted-foreground normal-case">
                @{profile.username}
              </span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {accountNavSections.map((section, index) => (
          <div key={section.title}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="tech-eyebrow px-2 py-1.5">
              {section.title}
            </DropdownMenuLabel>
            {section.title === "Profile" && profile ? (
              <DropdownMenuItem asChild>
                <Link
                  href={`/u/${profile.username}`}
                  className={cn(
                    isActivePath(pathname, `/u/${profile.username}`) && "bg-muted",
                  )}
                >
                  <UserRound aria-hidden />
                  Builder portfolio
                </Link>
              </DropdownMenuItem>
            ) : null}
            {section.items
              .filter(
                (item) =>
                  !("adminOnly" in item && item.adminOnly) || profile?.role === "admin",
              )
              .map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(isActivePath(pathname, item.href) && "bg-muted")}
                    >
                      <Icon aria-hidden />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            {section.title === "Workspace" && orgMembership ? (
              <DropdownMenuItem asChild>
                <Link
                  href={`/partners/${orgMembership.slug}`}
                  className={cn(
                    isActivePath(pathname, `/partners/${orgMembership.slug}`) &&
                      "bg-muted",
                  )}
                >
                  <Building2 aria-hidden />
                  {orgMembership.name} Hub
                </Link>
              </DropdownMenuItem>
            ) : null}
          </div>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/roadmaps">./start-building</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <form action={signOut} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut aria-hidden />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
