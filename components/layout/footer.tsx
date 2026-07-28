import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SiteContainer } from "@/components/layout/site-container";
import { footerNav, socialLinks, type SocialIconName } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type FooterProps = {
  className?: string;
};

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("relative border-t border-border bg-background", className)}>
      <SiteContainer className="flex flex-col gap-10 py-12">
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
                    title={item.title}
                    className="inline-flex size-9 items-center justify-center rounded-none border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <SocialIcon name={item.icon} />
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
                      key={`${group.title}-${item.title}`}
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
            &copy; {new Date().getFullYear()} Pull // code MIT · curriculum CC
            BY-SA 4.0
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
            <Link
              href="/credits"
              className="transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Credits
            </Link>
          </div>
        </div>
      </SiteContainer>
    </footer>
  );
}
