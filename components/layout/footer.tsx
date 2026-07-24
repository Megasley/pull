import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { footerNav, socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type FooterProps = {
  className?: string;
};

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("relative border-t border-border bg-background", className)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm whitespace-pre-line font-mono text-xs leading-relaxed text-muted-foreground">
              {"Become an Open Source Builder.\n\nLearn. Build. Contribute."}
            </p>
            {socialLinks.length > 0 ? (
              <nav aria-label="Social links" className="flex items-center gap-2 pt-1">
                {socialLinks.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.title}
                    className="inline-flex size-9 items-center justify-center rounded-none border border-border font-mono text-[11px] tracking-wide text-muted-foreground uppercase transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerNav.map((group) => (
              <div key={group.title} className="space-y-3">
                <p className="tech-eyebrow">{group.title}</p>
                <nav
                  aria-label={`${group.title} links`}
                  className="flex flex-col gap-2"
                >
                  {group.links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Pull // all rights reserved
          </p>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
