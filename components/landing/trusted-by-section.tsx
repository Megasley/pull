import { cn } from "@/lib/utils";

// Launching with Thebuidl first — Trezor Academy stays off this section
// until its partnership is finalized (see lib/ecosystem/partners.ts).
// Static, not a marquee: a single logo scrolling past itself just
// advertises that there's only one. Revisit the scrolling treatment once
// there are enough logos for motion to read as "many," not "looping."
const PARTNERS = [
  {
    name: "Thebuidl",
    logo: "/buidl-logo.svg",
    logoLight: true,
    height: "h-12",
    href: "https://thebuidl.xyz",
  },
];

export function TrustedBySection() {
  return (
    <section className="border-t border-b border-border bg-background py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 sm:flex-row sm:justify-center sm:gap-10 sm:px-6 lg:px-8">
        <p className="tech-eyebrow">Trusted By</p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {PARTNERS.map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noreferrer"
              className="group flex shrink-0 items-center justify-center dark:bg-brand-paper dark:px-3 dark:py-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partner.logo}
                alt={partner.name}
                className={cn(
                  "w-auto opacity-70 transition-opacity group-hover:opacity-100",
                  partner.height,
                  partner.logoLight && "invert",
                )}
                draggable={false}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
