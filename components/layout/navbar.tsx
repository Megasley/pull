import { Logo } from "@/components/brand/logo";
import { AuthControls } from "@/components/layout/auth-controls";
import { BetaBadge } from "@/components/layout/beta-badge";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteContainer } from "@/components/layout/site-container";
import { getCurrentSessionContext } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site-config";
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
        <div className="flex items-center gap-2">
          <Logo />
          <BetaBadge />
        </div>

        <MainNav />

        <div className="flex items-center gap-2">
          <a
            href={siteConfig.feedbackUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-none px-2.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:inline-flex"
          >
            Feedback
          </a>
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
