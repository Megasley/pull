import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SiteContainer } from "@/components/layout/site-container";
import { getCurrentSessionContext } from "@/lib/auth/session";
import {
  footerNav,
  isExternalHref,
  siteConfig,
  socialLinks,
  type SocialIconName,
} from "@/lib/site-config";
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

  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

const SIGNED_IN_ACCOUNT_TITLES = new Set(["Dashboard", "Settings"]);
const SIGNED_OUT_ACCOUNT_TITLES = new Set(["Sign in"]);

export async function Footer({ className }: FooterProps) {
  const { user } = await getCurrentSessionContext();
  const isAuthenticated = Boolean(user);

  const nav = footerNav.map((group) => {
    if (group.title !== "Account") return group;
    const allowed = isAuthenticated
      ? SIGNED_IN_ACCOUNT_TITLES
      : SIGNED_OUT_ACCOUNT_TITLES;
    return {
      ...group,
      links: group.links.filter((link) => allowed.has(link.title)),
    };
  });

  return (
    <footer className={cn("relative border-t border-border bg-background", className)}>
      <SiteContainer className="flex flex-col gap-10 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm whitespace-pre-line font-mono text-xs leading-relaxed text-muted-foreground">
              {"Become an Open Source Builder.\n\nLearn. Build. Contribute. Prove."}
            </p>
            <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
              Feedback welcome —{" "}
              <a
                href={siteConfig.feedbackUrl}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                open a GitHub issue
              </a>
              .
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

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {nav.map((group) => (
              <div key={group.title} className="space-y-3">
                <p className="tech-eyebrow">{group.title}</p>
                <nav
                  aria-label={`${group.title} links`}
                  className="flex flex-col gap-2"
                >
                  {group.links.map((item) => {
                    const external = isExternalHref(item.href);
                    const linkClass =
                      "font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

                    return external ? (
                      <a
                        key={`${group.title}-${item.title}`}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClass}
                      >
                        {item.title}
                      </a>
                    ) : (
                      <Link
                        key={`${group.title}-${item.title}`}
                        href={item.href}
                        className={linkClass}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Pull // code MIT · curriculum CC BY-SA 4.0
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
