import { Logo } from "@/components/brand/logo";
import { AuthControls } from "@/components/layout/auth-controls";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteContainer } from "@/components/layout/site-container";
import { getCurrentSessionContext } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type NavbarProps = {
  className?: string;
};

export async function Navbar({ className }: NavbarProps) {
  const { user, profile } = await getCurrentSessionContext();

  const displayName =
    profile?.displayName ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.user_name as string | undefined) ??
    "Builder";

  const avatarUrl =
    profile?.avatar ?? (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-background",
        className,
      )}
    >
      <SiteContainer className="relative flex h-14 items-center justify-between gap-4">
        <Logo />

        <MainNav />

        <div className="flex items-center gap-2">
          <AuthControls className="hidden md:flex" />
          <MobileNav
            isAuthenticated={Boolean(user)}
            displayName={displayName}
            avatarUrl={avatarUrl}
            profile={profile}
          />
        </div>
      </SiteContainer>
    </header>
  );
}
