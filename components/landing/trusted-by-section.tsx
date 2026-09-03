import { cn } from "@/lib/utils";

// Static, not a marquee: a handful of logos scrolling past themselves just
// advertises that there are only a few. Revisit the scrolling treatment
// once there are enough logos for motion to read as "many," not "looping."
const PARTNERS = [
  {
    name: "Thebuidl",
    logo: "/buidl-logo.svg",
    logoLight: true,
    height: "h-12",
    href: "https://thebuidl.xyz",
  },
  {
    name: "Trezor Academy",
    logo: "/trezor-academy-logo.svg",
    // Wordmark, not an icon (viewBox 194x18 vs TheBuidl's roughly-square
    // 57x45) — matching h-12 on both stretches this to ~500px wide and
    // drowns out the icon mark next to it. A much smaller height keeps the
    // two visually balanced.
    height: "h-5",
    href: "https://academy.trezor.io/",
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
