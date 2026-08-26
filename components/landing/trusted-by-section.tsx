import { cn } from "@/lib/utils";

const PARTNERS = [
  {
    name: "Trezor Academy",
    logo: "/trezor-academy-logo.svg",
    logoLight: false,
    height: "h-5",
    href: "https://academy.trezor.io/",
  },
  {
    name: "The Buidl",
    logo: "/buidl-logo.svg",
    logoLight: true,
    height: "h-9",
    href: "https://thebuidl.xyz",
  },
];

// Duplicate until we have enough items to fill two full scroll lengths
const MIN_ITEMS = 8;
const track = Array.from(
  { length: Math.ceil((MIN_ITEMS * 2) / PARTNERS.length) },
  () => PARTNERS,
).flat();

export function TrustedBySection() {
  return (
    <section className="border-t border-b border-border bg-background py-8">
      <div className="mx-auto mb-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="tech-eyebrow">Trusted By</p>
      </div>

      {/* Overflow mask + scrolling track */}
      <div
        className="relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <div
          className="flex w-max gap-16"
          style={{
            animation: "marquee 60s linear infinite",
          }}
        >
          {/* Two identical halves — when the first half scrolls out, the second
              fills the viewport seamlessly, then it loops back to 0. */}
          {[...track, ...track].map((partner, i) => (
            <a
              key={i}
              href={partner.href}
              target="_blank"
              rel="noreferrer"
              className="group flex shrink-0 items-center justify-center"
              aria-hidden={i >= track.length}
              tabIndex={i >= track.length ? -1 : undefined}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className={cn(
                  "w-auto opacity-70 transition-opacity group-hover:opacity-100",
                  partner.height,
                  partner.logoLight ? "invert dark:invert-0" : "dark:invert",
                )}
                draggable={false}
              />
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [style*="marquee"] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
