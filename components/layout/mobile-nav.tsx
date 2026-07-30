"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { signOut } from "@/app/actions/auth";
import { SiteContainer } from "@/components/layout/site-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  accountNavSections,
  isExternalHref,
  primaryNav,
  siteConfig,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { BuilderProfile } from "@/types/user";

type MobileNavProps = {
  isAuthenticated: boolean;
  displayName?: string;
  avatarUrl?: string | null;
  profile?: BuilderProfile | null;
};

type SectionTone = "learn" | "contribute" | "workspace" | "profile" | "account";

const sectionToneClass: Record<SectionTone, string> = {
  learn: "border-l-signal bg-signal/15",
  contribute: "border-l-ink/40 bg-ink/[0.04]",
  workspace: "border-l-ink bg-muted/50",
  profile: "border-l-ink/50 bg-card",
  account: "border-l-signal bg-signal/10",
};

const sectionLabelClass: Record<SectionTone, string> = {
  learn: "text-ink",
  contribute: "text-foreground",
  workspace: "text-foreground",
  profile: "text-foreground",
  account: "text-ink",
};

function isActivePath(pathname: string, href: string) {
  if (isExternalHref(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({
  title,
  tone,
  children,
}: {
  title: string;
  tone: SectionTone;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border border-border border-l-4",
        sectionToneClass[tone],
      )}
    >
      <p
        className={cn(
          "border-b border-border/70 px-3 py-2 font-mono text-[10px] font-medium tracking-[0.14em] uppercase",
          sectionLabelClass[tone],
        )}
      >
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function MobileLink({
  href,
  onClick,
  pathname,
  children,
  external = false,
}: {
  href: string;
  onClick: () => void;
  pathname: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const active = isActivePath(pathname, href);
  const className = cn(
    "block w-full border-b border-border/50 px-3 py-3.5 font-mono text-xs tracking-[0.1em] uppercase transition-colors last:border-b-0",
    active
      ? "bg-ink text-[var(--background)]"
      : "text-foreground/80 hover:bg-background hover:text-foreground",
  );

  if (external || isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

export function MobileNav({
  isAuthenticated,
  displayName,
  avatarUrl,
  profile,
}: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pathnameWhenOpen, setPathnameWhenOpen] = useState(pathname);
  const close = () => setOpen(false);

  // Close the drawer after client navigation (adjust state during render).
  if (open && pathnameWhenOpen !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initials = (displayName ?? "B")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const learnLinks = primaryNav.filter((item) => item.type === "link");
  const contributeLinks = primaryNav
    .filter((item) => item.type === "group")
    .flatMap((item) => item.items);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() =>
          setOpen((current) => {
            if (!current) {
              setPathnameWhenOpen(pathname);
            }
            return !current;
          })
        }
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {open ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 top-14 z-40 bg-ink/40"
          onClick={close}
        />
      ) : null}

      <div
        id="mobile-navigation"
        className={cn(
          "fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-b border-border bg-background transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <SiteContainer
          as="nav"
          aria-label="Mobile navigation"
          className="flex flex-col gap-4 py-5 pb-10"
        >
          {isAuthenticated ? (
            <div className="flex items-center gap-3 border border-border bg-card px-3 py-3">
              <Avatar className="size-10 shrink-0 rounded-none border border-border">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="rounded-none font-mono text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-medium tracking-wide uppercase">
                  {displayName}
                </p>
                {profile ? (
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    @{profile.username}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <NavSection title="Learn" tone="learn">
            {learnLinks.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                onClick={close}
              >
                {item.title}
              </MobileLink>
            ))}
          </NavSection>

          <NavSection title="Contribute" tone="contribute">
            {contributeLinks.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                onClick={close}
                external={
                  isExternalHref(item.href) ||
                  ("external" in item && Boolean(item.external))
                }
              >
                {item.title}
              </MobileLink>
            ))}
            <MobileLink
              href={siteConfig.feedbackUrl}
              pathname={pathname}
              onClick={close}
              external
            >
              Feedback
            </MobileLink>
          </NavSection>

          {isAuthenticated ? (
            <>
              {accountNavSections.map((section) => {
                const tone: SectionTone =
                  section.title === "Workspace" ? "workspace" : "profile";

                return (
                  <NavSection key={section.title} title={section.title} tone={tone}>
                    {section.title === "Profile" && profile ? (
                      <MobileLink
                        href={`/u/${profile.username}`}
                        pathname={pathname}
                        onClick={close}
                      >
                        Builder portfolio
                      </MobileLink>
                    ) : null}
                    {section.items.map((item) => (
                      <MobileLink
                        key={item.href}
                        href={item.href}
                        pathname={pathname}
                        onClick={close}
                      >
                        {item.title}
                      </MobileLink>
                    ))}
                    {section.title === "Workspace" ? (
                      <>
                        <MobileLink
                          href="/review"
                          pathname={pathname}
                          onClick={close}
                        >
                          Review
                        </MobileLink>
                        {profile?.role === "admin" ? (
                          <MobileLink
                            href="/admin"
                            pathname={pathname}
                            onClick={close}
                          >
                            Admin
                          </MobileLink>
                        ) : null}
                      </>
                    ) : null}
                  </NavSection>
                );
              })}

              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/roadmaps"
                  onClick={close}
                  className="block w-full border border-ink bg-ink px-3 py-3.5 text-center font-mono text-xs font-medium tracking-[0.1em] text-[var(--background)] uppercase transition-colors hover:bg-ink/90"
                >
                  ./start-building
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="block w-full border border-border bg-transparent px-3 py-3.5 text-center font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <NavSection title="Account" tone="account">
              <MobileLink href="/sign-in" pathname={pathname} onClick={close}>
                Sign in
              </MobileLink>
              <Link
                href="/roadmaps"
                onClick={close}
                className="block w-full border-t border-border bg-ink px-3 py-3.5 text-center font-mono text-xs font-medium tracking-[0.1em] text-[var(--background)] uppercase transition-colors hover:bg-ink/90"
              >
                ./start-building
              </Link>
            </NavSection>
          )}
        </SiteContainer>
      </div>
    </div>
  );
}
