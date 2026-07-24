import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentSessionContext } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

import { UserMenu } from "./user-menu";

type AuthControlsProps = {
  className?: string;
};

export async function AuthControls({ className }: AuthControlsProps) {
  const { user, profile } = await getCurrentSessionContext();

  if (!user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/roadmaps">./start</Link>
        </Button>
      </div>
    );
  }

  const displayName =
    profile?.displayName ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.user_name as string | undefined) ??
    "Builder";

  const avatarUrl =
    profile?.avatar ?? (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button size="sm" className="hidden md:inline-flex" asChild>
        <Link href="/dashboard">./dashboard</Link>
      </Button>
      <UserMenu profile={profile} displayName={displayName} avatarUrl={avatarUrl} />
    </div>
  );
}
