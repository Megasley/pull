"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

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

type DashboardAccountMenuProps = {
  displayName: string;
  username: string;
  avatar: string | null;
  initials: string;
  signOutAction: () => Promise<void>;
};

export function DashboardAccountMenu({
  displayName,
  username,
  avatar,
  initials,
  signOutAction,
}: DashboardAccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto gap-2 px-2 py-1.5"
          aria-label="Account menu"
        >
          <Avatar className="size-7 border border-ink/20">
            {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
            <AvatarFallback className="bg-signal text-[10px] text-ink">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate font-mono text-[11px] sm:inline">
            @{username}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            @{username}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/u/${username}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/roadmaps">Roadmaps</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/github">GitHub sync</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-default">
              Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
