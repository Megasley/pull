"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

type SectionTone =
  | "learn"
  | "build"
  | "contribute"
  | "builders"
  | "workspace"
  | "profile"
  | "account";

const sectionToneClass: Record<SectionTone, string> = {
  learn: "border-l-signal bg-background",
  build: "border-l-ink/55 bg-background",
  contribute: "border-l-ink/40 bg-background",
  builders: "border-l-signal bg-background",
  workspace: "border-l-ink bg-background",
  profile: "border-l-ink/50 bg-background",
  account: "border-l-signal bg-background",
};

const sectionLabelClass: Record<SectionTone, string> = {
  learn: "text-foreground",
  build: "text-foreground",
  contribute: "text-foreground",
  builders: "text-foreground",
  workspace: "text-foreground",
  profile: "text-foreground",
  account: "text-foreground",
};

function isActivePath(pathname: string, href: string) {
  if (isExternalHref(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function toneForNavGroup(title: string): SectionTone {
  const key = title.toLowerCase();
  if (key === "learn") return "learn";
  if (key === "build") return "build";
  if (key === "contribute") return "contribute";
  if (key === "builders" || key === "prove") return "builders";
  if (key === "developer tools") return "build";
  return "contribute";
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
    <section className={cn("border border-border border-l-4", sectionToneClass[tone])}>
      <p
        className={cn(
          "border-b border-border/70 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.22em]",
          sectionLabelClass[tone],
        )}
      >
        {title}
      </p>
      <ul role="list" className="flex flex-col">
        {children}
      </ul>
    </section>
  );
}

function NavBox({ tone, children }: { tone: SectionTone; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-none border border-border border-l-4",
        sectionToneClass[tone],
      )}
    >
      <ul role="list" className="flex flex-col">
        {children}
      </ul>
    </div>
  );
}

function MobileLink({
  href,
  onClick,
  pathname,
  children,
  external = false,
  className,
}: {
  href: string;
  onClick: () => void;
  pathname: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  const active = isActivePath(pathname, href);
  const baseClassName = cn(
    "block w-full border-b border-border/60 px-4 py-3.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
    active
      ? "bg-ink text-[var(--background)]"
      : "text-foreground/85 hover:bg-muted hover:text-foreground active:bg-muted/70",
    className,
  );

  if (external || isExternalHref(href)) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={onClick}
          className={baseClassName}
        >
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={baseClassName}
      >
        {children}
      </Link>
    </li>
  );
}

function TopLevelMobileLink({
  href,
  onClick,
  pathname,
  tone,
  children,
  external = false,
}: {
  href: string;
  onClick: () => void;
  pathname: string;
  tone: SectionTone;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <NavBox tone={tone}>
      <MobileLink href={href} onClick={onClick} pathname={pathname} external={external}>
        {children}
      </MobileLink>
    </NavBox>
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
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open || pathnameWhenOpen === pathname) {
      return;
    }
    queueMicrotask(close);
  }, [open, pathname, pathnameWhenOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    const opener = openButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [open]);

  const initials = (displayName ?? "B")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="md:hidden">
      <Button
        ref={openButtonRef}
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
          className="fixed inset-0 top-14 z-40 bg-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={close}
        />
      ) : null}

      <div
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-navigation-title"
        className={cn(
          "fixed inset-x-0 top-14 z-50 flex max-h-[calc(100dvh-3.5rem)] flex-col overscroll-contain border-b border-border bg-background transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <h2 id="mobile-navigation-title" className="sr-only">
          Site navigation
        </h2>

        <SiteContainer
          as="nav"
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col gap-3 py-4 pb-28">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 border border-border bg-card px-3.5 py-3">
                <Avatar className="size-10 shrink-0 rounded-none border border-border">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="rounded-none font-mono text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-medium uppercase tracking-wide">
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

            {primaryNav.map((item) => {
              if (item.type === "link") {
                return (
                  <TopLevelMobileLink
                    key={item.href}
                    href={item.href}
                    pathname={pathname}
                    onClick={close}
                    tone={toneForNavGroup(item.title)}
                  >
                    {item.title}
                  </TopLevelMobileLink>
                );
              }

              return (
                <NavSection
                  key={item.title}
                  title={item.title}
                  tone={toneForNavGroup(item.title)}
                >
                  {item.items.map((child) => (
                    <MobileLink
                      key={child.href}
                      href={child.href}
                      pathname={pathname}
                      onClick={close}
                      external={
                        isExternalHref(child.href) ||
                        ("external" in child && Boolean(child.external))
                      }
                    >
                      {child.title}
                    </MobileLink>
                  ))}
                  {item.title === "Contribute" ? (
                    <MobileLink
                      href={siteConfig.feedbackUrl}
                      pathname={pathname}
                      onClick={close}
                      external
                    >
                      Feedback
                    </MobileLink>
                  ) : null}
                </NavSection>
              );
            })}

            {isAuthenticated
              ? accountNavSections.map((section) => {
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
                    {section.items.map((navItem) => (
                      <MobileLink
                        key={navItem.href}
                        href={navItem.href}
                        pathname={pathname}
                        onClick={close}
                      >
                        {navItem.title}
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
                })
              : null}
          </div>
        </SiteContainer>

        <div
          className={cn(
            "sticky bottom-0 z-10 shrink-0 border-t border-border bg-background/95 backdrop-blur",
            "px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]",
          )}
        >
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link
                href="/roadmaps"
                onClick={close}
                className="block w-full border border-ink bg-ink px-3 py-3 text-center font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--background)] transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                ./start-building
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="block w-full border border-border bg-transparent px-3 py-3 text-center font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/sign-in"
                onClick={close}
                className="flex-1 border border-border bg-transparent px-3 py-3 text-center font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Sign in
              </Link>
              <Link
                href="/roadmaps"
                onClick={close}
                className="flex-[1.25] border border-ink bg-ink px-3 py-3 text-center font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--background)] transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                ./start-building
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
